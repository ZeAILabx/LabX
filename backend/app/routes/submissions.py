"""
Submissions Blueprint — Founder quest work submissions and submission history.
"""
from flask import Blueprint, request, jsonify, g
from app import get_supabase
from app.middleware.auth import require_founder

submissions_bp = Blueprint('submissions', __name__)


@submissions_bp.route('/quest/<quest_id>', methods=['POST', 'OPTIONS'])
@require_founder
def submit_quest(quest_id):
    """
    Submit work for a quest.
    Supports text, url, files, images.
    Creates database submission record with status 'under_review' or 'submitted'.
    Does NOT complete quest directly from React.
    """
    user_id = g.current_user['id']
    data = request.json or {}
    supabase = get_supabase()

    # 1. Fetch quest details
    quest = supabase.table('quests').select(
        'id, title, quest_type, mandatory, verification_required, points, milestone_id'
    ).eq('id', quest_id).execute()

    if not quest.data:
        return jsonify({'success': False, 'message': 'Quest not found'}), 404

    q = quest.data[0]

    # 2. Check if already completed/approved
    existing = supabase.table('quest_submissions').select('id, status').eq(
        'user_id', user_id
    ).eq('quest_id', quest_id).execute()

    for sub in (existing.data or []):
        if sub['status'] in ['approved', 'completed']:
            return jsonify({'success': False, 'message': 'Quest has already been completed and approved'}), 400

    submission_text = data.get('submission_text')
    submission_url = data.get('submission_url')
    submission_files = data.get('submission_files', [])

    if not submission_text and not submission_url and not submission_files:
        return jsonify({'success': False, 'message': 'Submission content required (text, url, or files)'}), 400

    # Determine initial status
    initial_status = 'under_review' if q['verification_required'] else 'approved'

    try:
        # Check if updating a previously rejected submission or inserting new
        rejected_sub = [s for s in (existing.data or []) if s['status'] == 'rejected']
        
        if rejected_sub:
            sub_id = rejected_sub[0]['id']
            res = supabase.table('quest_submissions').update({
                'status': initial_status,
                'submission_text': submission_text,
                'submission_url': submission_url,
                'submission_files': submission_files,
                'admin_feedback': None
            }).eq('id', sub_id).execute()
        else:
            res = supabase.table('quest_submissions').insert({
                'user_id': user_id,
                'quest_id': quest_id,
                'status': initial_status,
                'submission_text': submission_text,
                'submission_url': submission_url,
                'submission_files': submission_files
            }).execute()

        # If verification is NOT required, trigger points & progression immediately
        if not q['verification_required']:
            from app.services.points_engine import award_quest_points
            from app.services.progression_engine import update_milestone_progress
            from app.services.achievements_engine import check_and_award_quest_achievements, check_and_award_points_achievements

            award_quest_points(user_id, quest_id)
            update_milestone_progress(user_id, q['milestone_id'])
            check_and_award_quest_achievements(user_id)
            check_and_award_points_achievements(user_id)

        return jsonify({
            'success': True,
            'data': res.data[0] if res.data else {},
            'message': 'Quest submitted for review' if q['verification_required'] else 'Quest completed successfully!'
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@submissions_bp.route('', methods=['GET', 'OPTIONS'])
@require_founder
def get_my_submissions():
    """Get all submissions for the logged-in founder."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    res = supabase.table('quest_submissions').select(
        '*, quests(title, quest_type, points, milestones(name))'
    ).eq('user_id', user_id).order('created_at', desc=True).execute()

    return jsonify({'success': True, 'data': res.data or []}), 200
