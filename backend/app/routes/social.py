"""
Social Blueprint — Platform-wide social network endpoints.
"""
from flask import Blueprint, request, jsonify, g
from app import get_supabase
from app.middleware.auth import require_founder

social_bp = Blueprint('social', __name__)


@social_bp.route('/feed', methods=['GET', 'OPTIONS'])
@require_founder
def get_feed():
    """Get posts feed (followed founders + user's own posts). Paginated."""
    user_id = g.current_user['id']
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    offset = (page - 1) * per_page
    supabase = get_supabase()

    # Get list of user IDs being followed by current user
    follows = supabase.table('follows').select('following_id').eq('follower_id', user_id).execute()
    following_ids = [f['following_id'] for f in (follows.data or [])]
    following_ids.append(user_id)  # Include self

    posts = supabase.table('posts').select(
        '*, profiles!author_id(id, full_name, username, avatar_url, total_points, domains(name))'
    ).in_('author_id', following_ids).eq('is_active', True).order('created_at', desc=True).range(offset, offset + per_page - 1).execute()

    post_list = posts.data or []

    # Attach likes and comments count & liked_by_me status
    if post_list:
        post_ids = [p['id'] for p in post_list]
        
        # Likes by current user
        my_likes = supabase.table('post_likes').select('post_id').eq('user_id', user_id).in_('post_id', post_ids).execute()
        liked_post_ids = set(l['post_id'] for l in (my_likes.data or []))

        for p in post_list:
            likes_cnt = supabase.table('post_likes').select('id', count='exact').eq('post_id', p['id']).execute()
            comments_cnt = supabase.table('comments').select('id', count='exact').eq('post_id', p['id']).execute()
            
            p['likes_count'] = likes_cnt.count or 0
            p['comments_count'] = comments_cnt.count or 0
            p['is_liked'] = p['id'] in liked_post_ids

    return jsonify({'success': True, 'data': post_list, 'page': page, 'per_page': per_page}), 200


@social_bp.route('/explore', methods=['GET', 'OPTIONS'])
@require_founder
def explore():
    """Explore platform posts from all founders."""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    offset = (page - 1) * per_page
    user_id = g.current_user['id']
    supabase = get_supabase()

    posts = supabase.table('posts').select(
        '*, profiles!author_id(id, full_name, username, avatar_url, total_points, domains(name))'
    ).eq('is_active', True).order('created_at', desc=True).range(offset, offset + per_page - 1).execute()

    post_list = posts.data or []

    if post_list:
        post_ids = [p['id'] for p in post_list]
        my_likes = supabase.table('post_likes').select('post_id').eq('user_id', user_id).in_('post_id', post_ids).execute()
        liked_post_ids = set(l['post_id'] for l in (my_likes.data or []))

        for p in post_list:
            likes_cnt = supabase.table('post_likes').select('id', count='exact').eq('post_id', p['id']).execute()
            comments_cnt = supabase.table('comments').select('id', count='exact').eq('post_id', p['id']).execute()
            p['likes_count'] = likes_cnt.count or 0
            p['comments_count'] = comments_cnt.count or 0
            p['is_liked'] = p['id'] in liked_post_ids

    return jsonify({'success': True, 'data': post_list}), 200


@social_bp.route('/posts', methods=['POST', 'OPTIONS'])
@require_founder
def create_post():
    """Create a new post. Founder cannot manually set domain/stage/level."""
    user_id = g.current_user['id']
    data = request.json or {}
    content = data.get('content', '').strip()
    image_url = data.get('image_url')

    if not content:
        return jsonify({'success': False, 'message': 'Post content is required'}), 400

    supabase = get_supabase()
    try:
        res = supabase.table('posts').insert({
            'author_id': user_id,
            'content': content,
            'image_url': image_url
        }).execute()

        post = res.data[0] if res.data else {}
        author = supabase.table('profiles').select('id, full_name, username, avatar_url, domains(name)').eq('id', user_id).execute()
        post['profiles'] = author.data[0] if author.data else {}
        post['likes_count'] = 0
        post['comments_count'] = 0
        post['is_liked'] = False

        # Award first_post badge
        try:
            from app.services.achievements_engine import award_achievement
            award_achievement(user_id, 'first_post')
        except Exception:
            pass

        return jsonify({'success': True, 'data': post}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@social_bp.route('/posts/<post_id>/like', methods=['POST', 'OPTIONS'])
@require_founder
def toggle_like(post_id):
    """Like or unlike a post."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    existing = supabase.table('post_likes').select('id').eq('post_id', post_id).eq('user_id', user_id).execute()

    if existing.data:
        # Unlike
        supabase.table('post_likes').delete().eq('id', existing.data[0]['id']).execute()
        liked = False
    else:
        # Like
        supabase.table('post_likes').insert({'post_id': post_id, 'user_id': user_id}).execute()
        liked = True

    likes_cnt = supabase.table('post_likes').select('id', count='exact').eq('post_id', post_id).execute()

    return jsonify({'success': True, 'data': {'is_liked': liked, 'likes_count': likes_cnt.count or 0}}), 200


@social_bp.route('/posts/<post_id>/comments', methods=['GET', 'POST', 'OPTIONS'])
@require_founder
def handle_comments(post_id):
    """GET comments or POST a new comment."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    if request.method == 'GET':
        comments = supabase.table('comments').select(
            '*, profiles(id, full_name, username, avatar_url)'
        ).eq('post_id', post_id).order('created_at').execute()
        return jsonify({'success': True, 'data': comments.data or []}), 200

    else:
        data = request.json or {}
        content = data.get('content', '').strip()
        if not content:
            return jsonify({'success': False, 'message': 'Comment content required'}), 400

        res = supabase.table('comments').insert({
            'post_id': post_id,
            'user_id': user_id,
            'content': content
        }).execute()

        comm = res.data[0] if res.data else {}
        user_prof = supabase.table('profiles').select('id, full_name, username, avatar_url').eq('id', user_id).execute()
        comm['profiles'] = user_prof.data[0] if user_prof.data else {}

        return jsonify({'success': True, 'data': comm}), 201


@social_bp.route('/follow/<target_user_id>', methods=['POST', 'DELETE', 'OPTIONS'])
@require_founder
def handle_follow(target_user_id):
    """Follow or unfollow a founder. Prevents self-following."""
    user_id = g.current_user['id']

    if user_id == target_user_id:
        return jsonify({'success': False, 'message': 'Cannot follow yourself'}), 400

    supabase = get_supabase()

    if request.method == 'POST':
        try:
            supabase.table('follows').insert({
                'follower_id': user_id,
                'following_id': target_user_id
            }).execute()

            # Award first_follower badge to target_user_id
            try:
                from app.services.achievements_engine import award_achievement
                award_achievement(target_user_id, 'first_follower')
            except Exception:
                pass

            # Create notification for target founder
            try:
                follower_prof = supabase.table('profiles').select('full_name, username').eq('id', user_id).execute()
                follower_name = (follower_prof.data[0] if follower_prof.data else {}).get('full_name') or 'A founder'
                supabase.table('notifications').insert({
                    'user_id': target_user_id,
                    'type': 'follow',
                    'title': 'New Follower',
                    'message': f"{follower_name} started following you.",
                    'data': {'follower_id': user_id}
                }).execute()
            except Exception:
                pass

            return jsonify({'success': True, 'message': 'Followed successfully'}), 201
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 400
    else:
        supabase.table('follows').delete().eq('follower_id', user_id).eq('following_id', target_user_id).execute()
        return jsonify({'success': True, 'message': 'Unfollowed successfully'}), 200


@social_bp.route('/people', methods=['GET', 'OPTIONS'])
@require_founder
def get_people():
    """Get discoverable founders list with follow status and optional search filter."""
    user_id = g.current_user['id']
    search = request.args.get('search', '').strip()
    supabase = get_supabase()

    # Query profiles for founders excluding self and admins
    query = supabase.table('profiles').select(
        'id, full_name, username, avatar_url, bio, total_points, domain_id, domains(name)'
    ).eq('role', 'founder').eq('is_active', True).neq('id', user_id)

    if search:
        query = query.or_(f"full_name.ilike.%{search}%,username.ilike.%{search}%")

    res = query.order('created_at', desc=True).limit(50).execute()
    founders = res.data or []

    # Get current user's follow list to compute is_following
    follows_res = supabase.table('follows').select('following_id').eq('follower_id', user_id).execute()
    following_set = set(f['following_id'] for f in (follows_res.data or []))

    # Enrich with stage, level, and is_following status
    for f in founders:
        f['is_following'] = f['id'] in following_set

        fp = supabase.table('founder_progress').select(
            'stages(name), levels(name)'
        ).eq('user_id', f['id']).execute()

        if fp.data and fp.data[0]:
            stage_info = fp.data[0].get('stages') or {}
            level_info = fp.data[0].get('levels') or {}
            f['stage_name'] = stage_info.get('name', 'Discover')
            f['level_name'] = level_info.get('name', 'Level 1')
        else:
            f['stage_name'] = 'Discover'
            f['level_name'] = 'Level 1'

    return jsonify({'success': True, 'data': founders}), 200

