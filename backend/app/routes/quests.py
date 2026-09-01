"""
Quests Blueprint — Server-side filtered quest endpoints.
"""
from flask import Blueprint, jsonify, g
from app import get_supabase
from app.middleware.auth import require_founder

quests_bp = Blueprint('quests', __name__)


@quests_bp.route('/milestone/<milestone_id>', methods=['GET', 'OPTIONS'])
@require_founder
def get_milestone_quests(milestone_id):
    """
    SERVER-SIDE QUEST FILTERING (Critical Requirement #13).
    Verifies:
    1. Milestone exists.
    2. Belongs to Founder's Domain.
    3. Returns ONLY quests for this milestone.
    """
    user_id = g.current_user['id']
    supabase = get_supabase()

    # 1. Get founder profile
    profile = supabase.table('profiles').select('domain_id').eq('id', user_id).execute()
    if not profile.data or not profile.data[0].get('domain_id'):
        return jsonify({'success': False, 'message': 'Founder domain not set'}), 400

    founder_domain_id = profile.data[0]['domain_id']

    # 2. Get milestone info and check domain match
    milestone = supabase.table('milestones').select(
        '*, stages(id, name), levels(id, name, level_order)'
    ).eq('id', milestone_id).execute()

    if not milestone.data:
        return jsonify({'success': False, 'message': 'Milestone not found'}), 404

    milestone_data = milestone.data[0]

    if milestone_data.get('domain_id') != founder_domain_id:
        return jsonify({
            'success': False,
            'message': 'Access denied. Milestone does not belong to your domain'
        }), 403

    # 3. Check if milestone is unlocked for user
    ms_prog = supabase.table('milestone_progress').select('is_unlocked, is_completed, progress_percentage').eq(
        'user_id', user_id
    ).eq('milestone_id', milestone_id).execute()

    progress_info = ms_prog.data[0] if ms_prog.data else {'is_unlocked': False, 'is_completed': False, 'progress_percentage': 0}

    # 4. Fetch quests STRICTLY for this milestone
    quests = supabase.table('quests').select('*').eq(
        'milestone_id', milestone_id
    ).eq('is_active', True).eq('is_archived', False).order('quest_order').execute()

    quest_list = quests.data or []

    # Get submission status for each quest by this user
    quest_ids = [q['id'] for q in quest_list]
    submissions = []
    if quest_ids:
        sub_res = supabase.table('quest_submissions').select(
            'quest_id, status, submission_text, submission_url, created_at, admin_feedback'
        ).eq('user_id', user_id).in_('quest_id', quest_ids).execute()
        submissions = sub_res.data or []

    sub_map = {s['quest_id']: s for s in submissions}

    # Separate Core and Side Quests
    core_quests = []
    side_quests = []

    for q in quest_list:
        sub = sub_map.get(q['id'])
        q_copy = dict(q)
        q_copy['user_status'] = sub['status'] if sub else ('available' if progress_info.get('is_unlocked') else 'locked')
        q_copy['submission'] = sub

        if q['quest_type'] == 'core':
            core_quests.append(q_copy)
        else:
            side_quests.append(q_copy)

    return jsonify({
        'success': True,
        'data': {
            'milestone': milestone_data,
            'progress': progress_info,
            'core_quests': core_quests,
            'side_quests': side_quests
        }
    }), 200


@quests_bp.route('/<quest_id>', methods=['GET', 'OPTIONS'])
@require_founder
def get_quest_detail(quest_id):
    """Get detailed information for a single quest."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    quest = supabase.table('quests').select(
        '*, milestones(name, milestone_order), levels(name), stages(name), domains(name)'
    ).eq('id', quest_id).execute()

    if not quest.data:
        return jsonify({'success': False, 'message': 'Quest not found'}), 404

    # Get latest submission for this user
    sub = supabase.table('quest_submissions').select('*').eq(
        'user_id', user_id
    ).eq('quest_id', quest_id).order('created_at', desc=True).execute()

    latest_sub = sub.data[0] if sub.data else None

    return jsonify({
        'success': True,
        'data': {
            'quest': quest.data[0],
            'submission': latest_sub
        }
    }), 200
