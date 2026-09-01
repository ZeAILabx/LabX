"""
Achievements Blueprint — Database-driven achievements gallery.
"""
from flask import Blueprint, jsonify, g
from app import get_supabase
from app.middleware.auth import require_founder

from app.services.achievements_engine import sync_all_user_achievements

achievements_bp = Blueprint('achievements', __name__)


@achievements_bp.route('', methods=['GET', 'OPTIONS'])
@require_founder
def get_achievements():
    """Get all achievements with user's earned status."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    # Automatically evaluate and sync any qualifying achievements
    sync_all_user_achievements(user_id)

    # Get all active achievements
    all_ach = supabase.table('achievements').select('*').eq('is_active', True).execute()
    ach_list = all_ach.data or []

    # Get user's earned achievements
    earned = supabase.table('founder_achievements').select('achievement_id, earned_at').eq('user_id', user_id).execute()
    earned_map = {e['achievement_id']: e['earned_at'] for e in (earned.data or [])}

    for a in ach_list:
        is_earned = a['id'] in earned_map
        a['is_earned'] = is_earned
        a['earned_at'] = earned_map.get(a['id'])

    return jsonify({'success': True, 'data': ach_list}), 200
