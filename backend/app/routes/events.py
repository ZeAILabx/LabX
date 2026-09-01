"""
Events & Announcements Blueprint — Showcase endpoints.
NO registration system, NO RSVP, NO participant limit logic.
"""
from flask import Blueprint, request, jsonify
from app import get_supabase
from app.middleware.auth import require_auth

events_bp = Blueprint('events', __name__)


@events_bp.route('', methods=['GET', 'OPTIONS'])
@require_auth
def get_announcements():
    """
    Get published announcements and events.
    Supports filtering by type (event/announcement) and search.
    """
    supabase = get_supabase()
    ann_type = request.args.get('type')
    search = request.args.get('search')

    query = supabase.table('announcements').select('*').eq('status', 'published')

    if ann_type and ann_type in ['event', 'announcement']:
        query = query.eq('type', ann_type)

    if search:
        query = query.ilike('title', f'%{search}%')

    res = query.order('created_at', desc=True).execute()

    return jsonify({'success': True, 'data': res.data or []}), 200


@events_bp.route('/<announcement_id>', methods=['GET', 'OPTIONS'])
@require_auth
def get_announcement_detail(announcement_id):
    """Get single event/announcement detail."""
    supabase = get_supabase()
    res = supabase.table('announcements').select('*').eq('id', announcement_id).execute()

    if not res.data:
        return jsonify({'success': False, 'message': 'Event/Announcement not found'}), 404

    return jsonify({'success': True, 'data': res.data[0]}), 200
