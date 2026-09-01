"""
Profile Blueprint — Handles profile retrieval and founder editing.
"""
from flask import Blueprint, request, jsonify, g
from app import get_supabase
from app.middleware.auth import require_auth

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('', methods=['GET', 'OPTIONS'])
@require_auth
def get_profile():
    """Get profile of currently logged-in user."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    profile = supabase.table('profiles').select(
        '*, domains(name), guilds(name)'
    ).eq('id', user_id).execute()

    if not profile.data:
        return jsonify({'success': False, 'message': 'Profile not found'}), 404

    profile_data = profile.data[0]

    # Get founder progress details if founder
    progress = None
    if profile_data.get('role') == 'founder':
        fp = supabase.table('founder_progress').select(
            '*, stages(name), levels(name), milestones(name)'
        ).eq('user_id', user_id).execute()
        progress = fp.data[0] if fp.data else None

    # Get stats (followers, following, posts count)
    followers_cnt = supabase.table('follows').select('id', count='exact').eq('following_id', user_id).execute()
    following_cnt = supabase.table('follows').select('id', count='exact').eq('follower_id', user_id).execute()
    posts_cnt = supabase.table('posts').select('id', count='exact').eq('author_id', user_id).eq('is_active', True).execute()

    # Get earned badges
    from app.services.achievements_engine import sync_all_user_achievements
    sync_all_user_achievements(user_id)
    earned_res = supabase.table('founder_achievements').select(
        'earned_at, achievements(id, key, name, description, icon, category)'
    ).eq('user_id', user_id).execute()
    badges = [e['achievements'] for e in (earned_res.data or []) if e.get('achievements')]

    data = dict(profile_data)
    data['progress'] = progress
    data['badges'] = badges
    data['stats'] = {
        'followers': followers_cnt.count or 0,
        'following': following_cnt.count or 0,
        'posts': posts_cnt.count or 0,
        'badges_count': len(badges)
    }

    return jsonify({'success': True, 'data': data}), 200


@profile_bp.route('/<user_id>', methods=['GET', 'OPTIONS'])
@require_auth
def get_user_profile(user_id):
    """Get public profile of another user or self by ID."""
    supabase = get_supabase()
    current_user_id = g.current_user['id']

    profile = supabase.table('profiles').select(
        'id, full_name, username, bio, avatar_url, role, total_points, created_at, domains(name), guilds(name)'
    ).eq('id', user_id).execute()

    if not profile.data:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    profile_data = profile.data[0]

    # Get founder progress details if founder
    progress = None
    if profile_data.get('role') == 'founder':
        fp = supabase.table('founder_progress').select(
            '*, stages(name), levels(name), milestones(name)'
        ).eq('user_id', user_id).execute()
        if fp.data:
            progress = fp.data[0]

    # Stats
    followers_cnt = supabase.table('follows').select('id', count='exact').eq('following_id', user_id).execute()
    following_cnt = supabase.table('follows').select('id', count='exact').eq('follower_id', user_id).execute()
    posts_cnt = supabase.table('posts').select('id', count='exact').eq('author_id', user_id).eq('is_active', True).execute()

    # Get earned badges
    from app.services.achievements_engine import sync_all_user_achievements
    sync_all_user_achievements(user_id)
    earned_res = supabase.table('founder_achievements').select(
        'earned_at, achievements(id, key, name, description, icon, category)'
    ).eq('user_id', user_id).execute()
    badges = [e['achievements'] for e in (earned_res.data or []) if e.get('achievements')]

    # Is following check
    is_following = False
    if current_user_id != user_id:
        f_check = supabase.table('follows').select('id').eq('follower_id', current_user_id).eq('following_id', user_id).execute()
        is_following = bool(f_check.data)

    data = dict(profile_data)
    data['progress'] = progress
    data['badges'] = badges
    data['stats'] = {
        'followers': followers_cnt.count or 0,
        'following': following_cnt.count or 0,
        'posts': posts_cnt.count or 0,
        'badges_count': len(badges)
    }
    data['is_following'] = is_following

    return jsonify({'success': True, 'data': data}), 200


@profile_bp.route('/<user_id>/posts', methods=['GET', 'OPTIONS'])
@require_auth
def get_user_posts(user_id):
    """Get posts published by specific user."""
    supabase = get_supabase()
    current_user_id = g.current_user['id']

    posts = supabase.table('posts').select(
        '*, profiles!author_id(id, full_name, username, avatar_url, total_points, domains(name))'
    ).eq('author_id', user_id).eq('is_active', True).order('created_at', desc=True).execute()

    post_list = posts.data or []

    if post_list:
        post_ids = [p['id'] for p in post_list]
        my_likes = supabase.table('post_likes').select('post_id').eq('user_id', current_user_id).in_('post_id', post_ids).execute()
        liked_post_ids = set(l['post_id'] for l in (my_likes.data or []))

        for p in post_list:
            likes_cnt = supabase.table('post_likes').select('id', count='exact').eq('post_id', p['id']).execute()
            comments_cnt = supabase.table('comments').select('id', count='exact').eq('post_id', p['id']).execute()
            p['likes_count'] = likes_cnt.count or 0
            p['comments_count'] = comments_cnt.count or 0
            p['is_liked'] = p['id'] in liked_post_ids

    return jsonify({'success': True, 'data': post_list}), 200


@profile_bp.route('/<user_id>/followers', methods=['GET', 'OPTIONS'])
@require_auth
def get_user_followers(user_id):
    """Get list of users following user_id."""
    supabase = get_supabase()
    current_user_id = g.current_user['id']

    follows = supabase.table('follows').select(
        'follower_id, profiles!follower_id(id, full_name, username, avatar_url, bio, total_points, domains(name))'
    ).eq('following_id', user_id).execute()

    followers = [f['profiles'] for f in (follows.data or []) if f.get('profiles')]

    my_follows = supabase.table('follows').select('following_id').eq('follower_id', current_user_id).execute()
    following_set = set(f['following_id'] for f in (my_follows.data or []))

    for f in followers:
        f['is_following'] = f['id'] in following_set

    return jsonify({'success': True, 'data': followers}), 200


@profile_bp.route('/<user_id>/following', methods=['GET', 'OPTIONS'])
@require_auth
def get_user_following(user_id):
    """Get list of users followed by user_id."""
    supabase = get_supabase()
    current_user_id = g.current_user['id']

    follows = supabase.table('follows').select(
        'following_id, profiles!following_id(id, full_name, username, avatar_url, bio, total_points, domains(name))'
    ).eq('follower_id', user_id).execute()

    following_users = [f['profiles'] for f in (follows.data or []) if f.get('profiles')]

    my_follows = supabase.table('follows').select('following_id').eq('follower_id', current_user_id).execute()
    following_set = set(f['following_id'] for f in (my_follows.data or []))

    for f in following_users:
        f['is_following'] = f['id'] in following_set

    return jsonify({'success': True, 'data': following_users}), 200


@profile_bp.route('', methods=['PUT', 'OPTIONS'])
@require_auth
def update_profile():
    """Update profile fields allowed for users (bio, username, avatar_url, full_name)."""
    user_id = g.current_user['id']
    data = request.json or {}
    supabase = get_supabase()

    allowed_updates = {}
    for key in ['full_name', 'username', 'bio', 'avatar_url']:
        if key in data:
            allowed_updates[key] = data[key]

    if not allowed_updates:
        return jsonify({'success': False, 'message': 'No valid fields provided for update'}), 400

    try:
        updated = supabase.table('profiles').update(allowed_updates).eq('id', user_id).execute()
        return jsonify({'success': True, 'data': updated.data[0] if updated.data else {}}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

