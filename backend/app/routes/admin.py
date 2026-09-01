"""
Admin Blueprint — Admin Management endpoints.
Requires 'admin' role.
"""
from flask import Blueprint, request, jsonify, g
from app import get_supabase
from app.middleware.auth import require_admin
from app.services.points_engine import award_quest_points
from app.services.progression_engine import update_milestone_progress

admin_bp = Blueprint('admin', __name__)


# ── Analytics ────────────────────────────────────────────────────────
@admin_bp.route('/analytics', methods=['GET', 'OPTIONS'])
@require_admin
def get_analytics():
    """Get overall platform analytics."""
    supabase = get_supabase()

    founders_cnt = supabase.table('profiles').select('id', count='exact').eq('role', 'founder').execute()
    active_founders = supabase.table('profiles').select('id', count='exact').eq('role', 'founder').eq('is_active', True).execute()
    submissions_cnt = supabase.table('quest_submissions').select('id', count='exact').execute()
    pending_sub_cnt = supabase.table('quest_submissions').select('id', count='exact').eq('status', 'under_review').execute()

    posts_cnt = supabase.table('posts').select('id', count='exact').eq('is_active', True).execute()
    quests_cnt = supabase.table('quests').select('id', count='exact').eq('is_active', True).execute()

    # Domain distribution
    domains = supabase.table('domains').select('id, name').execute()
    domain_dist = []
    for d in (domains.data or []):
        cnt = supabase.table('profiles').select('id', count='exact').eq('domain_id', d['id']).execute()
        domain_dist.append({
            'domain_id': d['id'],
            'domain_name': d['name'],
            'founder_count': cnt.count or 0
        })

    return jsonify({
        'success': True,
        'data': {
            'total_founders': founders_cnt.count or 0,
            'active_founders': active_founders.count or 0,
            'total_submissions': submissions_cnt.count or 0,
            'pending_verifications': pending_sub_cnt.count or 0,
            'total_posts': posts_cnt.count or 0,
            'total_quests': quests_cnt.count or 0,
            'domain_distribution': domain_dist
        }
    }), 200


# ── Admin Roadmap Tree (all domains, for quest creation dropdowns) ────
@admin_bp.route('/roadmap-tree', methods=['GET', 'OPTIONS'])
@require_admin
def get_admin_roadmap_tree():
    """
    Returns all 12 domains, all 5 stages, all 25 levels, and all milestones
    so the admin can use cascading dropdowns when creating quests.
    No user filtering — full tree for all domains.
    """
    supabase = get_supabase()

    domains = supabase.table('domains').select('id, name, icon').order('display_order').execute()
    stages = supabase.table('stages').select('id, name, stage_order').order('stage_order').execute()
    levels = supabase.table('levels').select('id, name, level_order, stage_id').order('level_order').execute()
    milestones = supabase.table('milestones').select(
        'id, name, milestone_order, domain_id, stage_id, level_id'
    ).order('milestone_order').execute()

    return jsonify({
        'success': True,
        'data': {
            'domains': domains.data or [],
            'stages': stages.data or [],
            'levels': levels.data or [],
            'milestones': milestones.data or [],
        }
    }), 200


# ── Quest Verification ───────────────────────────────────────────────
@admin_bp.route('/verification', methods=['GET', 'OPTIONS'])
@require_admin
def get_verification_queue():
    """Get quest submissions for verification by status (under_review, approved, rejected, completed)."""
    status = request.args.get('status', 'under_review')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset = (page - 1) * per_page
    supabase = get_supabase()

    res = supabase.table('quest_submissions').select(
        '*, profiles!user_id(id, full_name, email, avatar_url, domains(name)), quests(id, title, quest_type, points, milestone_id, milestones(name, levels(name, stages(name))))'
    ).eq('status', status).order('created_at', desc=True).range(offset, offset + per_page - 1).execute()

    return jsonify({'success': True, 'data': res.data or []}), 200


@admin_bp.route('/verification/<submission_id>/review', methods=['POST', 'OPTIONS'])
@require_admin
def review_submission(submission_id):
    """
    Approve or reject a submission.
    Approve: status -> approved -> awards points -> updates milestone progress.
    Reject: status -> rejected + requires admin feedback.
    """
    admin_id = g.current_user['id']
    data = request.json or {}
    action = data.get('action')  # 'approve' or 'reject'
    feedback = data.get('feedback', '').strip()

    if action not in ['approve', 'reject']:
        return jsonify({'success': False, 'message': "Action must be 'approve' or 'reject'"}), 400

    if action == 'reject' and not feedback:
        return jsonify({'success': False, 'message': 'Feedback is required when rejecting work'}), 400

    supabase = get_supabase()

    # Get submission
    sub = supabase.table('quest_submissions').select(
        'id, user_id, quest_id, status, quests(id, title, points, milestone_id)'
    ).eq('id', submission_id).single().execute()

    if not sub.data:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404

    s = sub.data
    user_id = s['user_id']
    quest_id = s['quest_id']
    milestone_id = s['quests']['milestone_id']

    try:
        if action == 'approve':
            # Update status
            supabase.table('quest_submissions').update({
                'status': 'approved',
                'admin_feedback': feedback,
                'reviewed_by': admin_id
            }).eq('id', submission_id).execute()

            # Award LABX points
            points_tx = award_quest_points(user_id, quest_id)

            # Update milestone progression
            is_complete = update_milestone_progress(user_id, milestone_id)

            # Check and award badges/achievements
            from app.services.achievements_engine import check_and_award_quest_achievements, check_and_award_points_achievements
            check_and_award_quest_achievements(user_id)
            check_and_award_points_achievements(user_id)

            # Notify founder
            supabase.table('notifications').insert({
                'user_id': user_id,
                'type': 'quest_approved',
                'title': 'Quest Approved! 🎉',
                'message': f"Your submission for '{s['quests']['title']}' has been approved! +{s['quests']['points']} Points awarded.",
                'data': {'submission_id': submission_id, 'quest_id': quest_id}
            }).execute()

            return jsonify({
                'success': True,
                'message': 'Submission approved',
                'data': {'points_awarded': s['quests']['points'], 'milestone_completed': is_complete}
            }), 200

        else:  # Reject
            supabase.table('quest_submissions').update({
                'status': 'rejected',
                'admin_feedback': feedback,
                'reviewed_by': admin_id
            }).eq('id', submission_id).execute()

            # Notify founder
            supabase.table('notifications').insert({
                'user_id': user_id,
                'type': 'quest_rejected',
                'title': 'Quest Submission Feedback',
                'message': f"Your submission for '{s['quests']['title']}' requires changes: {feedback}",
                'data': {'submission_id': submission_id, 'quest_id': quest_id}
            }).execute()

            return jsonify({'success': True, 'message': 'Submission rejected with feedback'}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ── Quest Management ────────────────────────────────────────────────
@admin_bp.route('/quests', methods=['GET', 'POST', 'OPTIONS'])
@require_admin
def handle_quests():
    """GET list of quests or POST new quest."""
    supabase = get_supabase()

    if request.method == 'GET':
        milestone_id = request.args.get('milestone_id')
        domain_id = request.args.get('domain_id')
        query = supabase.table('quests').select('*, domains(name), stages(name), levels(name), milestones(name)')

        if milestone_id:
            query = query.eq('milestone_id', milestone_id)
        elif domain_id:
            query = query.eq('domain_id', domain_id)

        res = query.order('created_at', desc=True).execute()
        return jsonify({'success': True, 'data': res.data or []}), 200

    else:
        # Create quest
        data = request.json or {}
        required = ['title', 'domain_id', 'stage_id', 'level_id', 'milestone_id', 'quest_type', 'points']
        for field in required:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400

        try:
            res = supabase.table('quests').insert({
                'title': data['title'],
                'description': data.get('description', ''),
                'instructions': data.get('instructions', ''),
                'objective': data.get('objective', ''),
                'expected_output': data.get('expected_output', ''),
                'domain_id': data['domain_id'],
                'stage_id': data['stage_id'],
                'level_id': data['level_id'],
                'milestone_id': data['milestone_id'],
                'quest_type': data['quest_type'],
                'difficulty': data.get('difficulty', 'medium'),
                'points': data['points'],
                'mandatory': data.get('mandatory', True),
                'submission_type': data.get('submission_type', 'text'),
                'verification_required': data.get('verification_required', True),
                'resource_links': data.get('resource_links', []),
                'attachments': data.get('attachments', [])
            }).execute()

            return jsonify({'success': True, 'data': res.data[0] if res.data else {}}), 201
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/quests/<quest_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
@require_admin
def update_delete_quest(quest_id):
    """PUT edit quest or DELETE quest (safe delete / archive if has submissions)."""
    supabase = get_supabase()

    if request.method == 'PUT':
        data = request.json or {}
        res = supabase.table('quests').update(data).eq('id', quest_id).execute()
        return jsonify({'success': True, 'data': res.data[0] if res.data else {}}), 200

    else:  # DELETE
        # Check if quest has existing submissions
        subs = supabase.table('quest_submissions').select('id', count='exact').eq('quest_id', quest_id).execute()

        if subs.count and subs.count > 0:
            # Safe delete: Archive instead of hard delete to preserve historical records
            supabase.table('quests').update({'is_active': False, 'is_archived': True}).eq('id', quest_id).execute()
            return jsonify({'success': True, 'message': 'Quest has active submissions. Safely archived/deactivated.'}), 200
        else:
            # Safe to hard delete
            supabase.table('quests').delete().eq('id', quest_id).execute()
            return jsonify({'success': True, 'message': 'Quest deleted'}), 200


# ── Announcements CRUD ──────────────────────────────────────────────
@admin_bp.route('/announcements', methods=['GET', 'POST', 'OPTIONS'])
@require_admin
def handle_admin_announcements():
    """Admin GET all or POST new event/announcement."""
    supabase = get_supabase()

    if request.method == 'GET':
        res = supabase.table('announcements').select('*').order('created_at', desc=True).execute()
        return jsonify({'success': True, 'data': res.data or []}), 200

    else:
        data = request.json or {}
        admin_id = g.current_user['id']
        title = data.get('title')
        if not title:
            return jsonify({'success': False, 'message': 'Title required'}), 400

        try:
            res = supabase.table('announcements').insert({
                'title': title,
                'description': data.get('description'),
                'type': data.get('type', 'announcement'),
                'event_date': data.get('event_date'),
                'event_time': data.get('event_time'),
                'location': data.get('location'),
                'is_online': data.get('is_online', False),
                'meeting_url': data.get('meeting_url'),
                'banner_url': data.get('banner_url'),
                'speaker': data.get('speaker'),
                'external_url': data.get('external_url'),
                'status': data.get('status', 'published'),
                'created_by': admin_id
            }).execute()

            return jsonify({'success': True, 'data': res.data[0] if res.data else {}}), 201
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/announcements/<ann_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
@require_admin
def edit_delete_announcement(ann_id):
    """Update or delete an announcement/event."""
    supabase = get_supabase()

    if request.method == 'PUT':
        data = request.json or {}
        res = supabase.table('announcements').update(data).eq('id', ann_id).execute()
        return jsonify({'success': True, 'data': res.data[0] if res.data else {}}), 200

    else:
        supabase.table('announcements').delete().eq('id', ann_id).execute()
        return jsonify({'success': True, 'message': 'Announcement deleted'}), 200


# ── Founder List Management ──────────────────────────────────────────
@admin_bp.route('/founders', methods=['GET', 'OPTIONS'])
@require_admin
def get_founders():
    """Get paginated list of registered founders."""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search')
    domain_id = request.args.get('domain_id')
    offset = (page - 1) * per_page
    supabase = get_supabase()

    query = supabase.table('profiles').select(
        '*, domains(name), guilds(name)'
    ).eq('role', 'founder')

    if domain_id:
        query = query.eq('domain_id', domain_id)

    if search:
        query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%")

    res = query.order('created_at', desc=True).range(offset, offset + per_page - 1).execute()

    return jsonify({'success': True, 'data': res.data or []}), 200


# ── Optional Assessment Reset (for testing/support) ────────────────
@admin_bp.route('/founders/<user_id>/reset-assessment', methods=['POST', 'OPTIONS'])
@require_admin
def reset_founder_assessment(user_id):
    """Admin function to reset a founder's assessment if required."""
    supabase = get_supabase()

    # Clear assessment
    supabase.table('founder_assessments').delete().eq('user_id', user_id).execute()

    # Update profile
    supabase.table('profiles').update({
        'assessment_completed': False,
        'domain_id': None,
        'guild_id': None
    }).eq('id', user_id).execute()

    # Remove progress records
    supabase.table('founder_progress').delete().eq('user_id', user_id).execute()
    supabase.table('milestone_progress').delete().eq('user_id', user_id).execute()
    supabase.table('level_progress').delete().eq('user_id', user_id).execute()
    supabase.table('stage_progress').delete().eq('user_id', user_id).execute()
    supabase.table('guild_members').delete().eq('user_id', user_id).execute()

    return jsonify({'success': True, 'message': 'Founder assessment reset successfully'}), 200
