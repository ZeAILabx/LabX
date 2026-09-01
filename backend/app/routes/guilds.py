"""
Guilds Blueprint — Private domain-based community endpoints.
Enforces that founders can ONLY access their own Guild.
"""
from flask import Blueprint, request, jsonify, g
from app import get_supabase
from app.middleware.auth import require_founder

guilds_bp = Blueprint('guilds', __name__)


@guilds_bp.route('/me', methods=['GET', 'OPTIONS'])
@require_founder
def get_my_guild():
    """Get the assigned Guild details for the current founder."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    profile = supabase.table('profiles').select('guild_id').eq('id', user_id).execute()
    if not profile.data or not profile.data[0].get('guild_id'):
        return jsonify({'success': False, 'message': 'Guild not assigned. Complete assessment first.'}), 400

    guild_id = profile.data[0]['guild_id']

    guild = supabase.table('guilds').select('*, domains(name)').eq('id', guild_id).execute()
    guild_data = guild.data[0] if guild.data else None
    
    # Count members
    members_cnt = supabase.table('guild_members').select('id', count='exact').eq('guild_id', guild_id).execute()

    return jsonify({
        'success': True,
        'data': {
            'guild': guild_data,
            'member_count': members_cnt.count or 0
        }
    }), 200


@guilds_bp.route('/members', methods=['GET', 'OPTIONS'])
@require_founder
def get_guild_members():
    """Get members of the founder's Guild."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    profile = supabase.table('profiles').select('guild_id').eq('id', user_id).execute()
    if not profile.data or not profile.data[0].get('guild_id'):
        return jsonify({'success': False, 'message': 'Guild not assigned'}), 400

    guild_id = profile.data[0]['guild_id']
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset = (page - 1) * per_page

    members = supabase.table('guild_members').select(
        'joined_at, profiles(id, full_name, username, avatar_url, role, total_points)'
    ).eq('guild_id', guild_id).range(offset, offset + per_page - 1).execute()

    return jsonify({'success': True, 'data': members.data or []}), 200


@guilds_bp.route('/messages', methods=['GET', 'OPTIONS'])
@require_founder
def get_guild_messages():
    """Get paginated chat messages for the founder's Guild."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    profile = supabase.table('profiles').select('guild_id').eq('id', user_id).execute()
    if not profile.data or not profile.data[0].get('guild_id'):
        return jsonify({'success': False, 'message': 'Guild not assigned'}), 400

    guild_id = profile.data[0]['guild_id']
    limit = int(request.args.get('limit', 50))

    messages = supabase.table('guild_messages').select(
        '*, profiles(id, full_name, username, avatar_url)'
    ).eq('guild_id', guild_id).order('created_at', desc=True).limit(limit).execute()

    # Return chronological order
    data = list(reversed(messages.data or []))

    return jsonify({'success': True, 'data': data}), 200


@guilds_bp.route('/messages', methods=['POST', 'OPTIONS'])
@require_founder
def send_guild_message():
    """Send a chat message to the founder's Guild."""
    user_id = g.current_user['id']
    data = request.json or {}
    content = data.get('content', '').strip()

    if not content:
        return jsonify({'success': False, 'message': 'Message content cannot be empty'}), 400

    supabase = get_supabase()
    profile = supabase.table('profiles').select('guild_id').eq('id', user_id).execute()
    if not profile.data or not profile.data[0].get('guild_id'):
        return jsonify({'success': False, 'message': 'Guild not assigned'}), 400

    guild_id = profile.data[0]['guild_id']

    try:
        res = supabase.table('guild_messages').insert({
            'guild_id': guild_id,
            'user_id': user_id,
            'content': content
        }).execute()

        # Get profile for response
        msg = res.data[0] if res.data else {}
        user_prof = supabase.table('profiles').select('id, full_name, username, avatar_url').eq('id', user_id).execute()
        msg['profiles'] = user_prof.data[0] if user_prof.data else {}

        # Award first_guild_message badge
        try:
            from app.services.achievements_engine import award_achievement
            award_achievement(user_id, 'first_guild_message')
        except Exception:
            pass

        return jsonify({'success': True, 'data': msg}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
