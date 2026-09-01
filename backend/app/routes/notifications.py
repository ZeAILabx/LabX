"""
Notifications Blueprint — Founder notification list and read status updates.
"""
from flask import Blueprint, request, jsonify, g
from app import get_supabase
from app.middleware.auth import require_founder

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET', 'OPTIONS'])
@require_founder
def get_notifications():
    """Get all notifications for current founder."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    res = supabase.table('notifications').select('*').eq(
        'user_id', user_id
    ).order('created_at', desc=True).limit(50).execute()

    unread_cnt = supabase.table('notifications').select('id', count='exact').eq(
        'user_id', user_id
    ).eq('is_read', False).execute()

    return jsonify({
        'success': True,
        'data': {
            'notifications': res.data or [],
            'unread_count': unread_cnt.count or 0
        }
    }), 200


@notifications_bp.route('/<notification_id>/read', methods=['PUT', 'OPTIONS'])
@require_founder
def mark_read(notification_id):
    """Mark a notification as read."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    res = supabase.table('notifications').update({
        'is_read': True
    }).eq('id', notification_id).eq('user_id', user_id).execute()

    return jsonify({'success': True, 'data': res.data[0] if res.data else {}}), 200


@notifications_bp.route('/read-all', methods=['PUT', 'OPTIONS'])
@require_founder
def mark_all_read():
    """Mark all notifications as read for current founder."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    supabase.table('notifications').update({
        'is_read': True
    }).eq('user_id', user_id).eq('is_read', False).execute()

    return jsonify({'success': True, 'message': 'All notifications marked as read'}), 200
