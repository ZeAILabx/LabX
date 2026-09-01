"""
Leaderboard Blueprint — Delivers global and domain-specific founder rankings.
"""
from flask import Blueprint, jsonify, request, g
from app import get_supabase
from app.middleware.auth import require_auth

leaderboard_bp = Blueprint('leaderboard', __name__)


@leaderboard_bp.route('', methods=['GET', 'OPTIONS'])
@require_auth
def get_leaderboard():
    """
    Get ranked founders leaderboard.
    Query parameters:
    - scope: 'domain' (user's domain), 'all' (global), or specific domain_id UUID
    - limit: int (default 50)
    - search: string (optional founder name/username search)
    """
    user_id = g.current_user['id']
    supabase = get_supabase()

    # Get current user's profile to know domain
    user_prof = supabase.table('profiles').select('id, domain_id, total_points, full_name, username, avatar_url, domains(id, name)').eq('id', user_id).execute()
    user_profile = user_prof.data[0] if user_prof.data else {}
    user_domain_id = user_profile.get('domain_id')

    scope = request.args.get('scope', 'all')
    domain_id = request.args.get('domain_id')
    search = request.args.get('search', '').strip()
    limit = min(int(request.args.get('limit', 50)), 100)

    # Build query
    query = supabase.table('profiles').select(
        'id, full_name, username, avatar_url, bio, role, total_points, created_at, domain_id, domains(id, name, icon), guilds(id, name)'
    ).eq('role', 'founder')

    # Apply domain filter
    target_domain_id = None
    if scope == 'domain':
        if user_domain_id:
            target_domain_id = user_domain_id
            query = query.eq('domain_id', user_domain_id)
    elif domain_id and domain_id != 'all':
        target_domain_id = domain_id
        query = query.eq('domain_id', domain_id)

    # Order by points descending
    query = query.order('total_points', desc=True).order('created_at', desc=False)

    res = query.execute()
    founders = res.data or []

    # Get active stage/level for each founder from founder_progress
    founder_ids = [f['id'] for f in founders]
    prog_map = {}
    badges_map = {}

    if founder_ids:
        try:
            prog_res = supabase.table('founder_progress').select(
                'user_id, stages(name), levels(name)'
            ).in_('user_id', founder_ids).execute()
            for p in (prog_res.data or []):
                prog_map[p['user_id']] = {
                    'stage': p.get('stages', {}).get('name') if p.get('stages') else 'Discover',
                    'level': p.get('levels', {}).get('name') if p.get('levels') else 'Level 1'
                }
        except Exception:
            pass

        try:
            ach_res = supabase.table('founder_achievements').select('user_id').in_('user_id', founder_ids).execute()
            for a in (ach_res.data or []):
                uid = a['user_id']
                badges_map[uid] = badges_map.get(uid, 0) + 1
        except Exception:
            pass

    # Rank calculation & enrich
    ranked_list = []
    user_rank = None

    for idx, f in enumerate(founders, start=1):
        f_id = f['id']
        prog = prog_map.get(f_id, {'stage': 'Discover', 'level': 'Level 1'})
        item = {
            'rank': idx,
            'id': f_id,
            'full_name': f.get('full_name') or 'Founder',
            'username': f.get('username') or 'founder',
            'avatar_url': f.get('avatar_url'),
            'domain': f.get('domains', {}).get('name') if f.get('domains') else 'General Tech',
            'domain_id': f.get('domain_id'),
            'domain_icon': f.get('domains', {}).get('icon') if f.get('domains') else '💡',
            'stage': prog['stage'],
            'level': prog['level'],
            'total_points': f.get('total_points', 0),
            'badges_count': badges_map.get(f_id, 0),
            'is_current_user': (f_id == user_id)
        }

        if f_id == user_id:
            user_rank = item

        # Search filter if provided
        if search:
            s = search.lower()
            if s in item['full_name'].lower() or s in item['username'].lower() or s in item['domain'].lower():
                ranked_list.append(item)
        else:
            ranked_list.append(item)

    # If user wasn't in the top results, calculate user's standing
    if not user_rank:
        user_rank = {
            'rank': len(founders) + 1,
            'id': user_id,
            'full_name': user_profile.get('full_name') or 'You',
            'username': user_profile.get('username') or 'founder',
            'avatar_url': user_profile.get('avatar_url'),
            'domain': user_profile.get('domains', {}).get('name') if user_profile.get('domains') else 'Your Domain',
            'domain_id': user_domain_id,
            'total_points': user_profile.get('total_points', 0),
            'badges_count': badges_map.get(user_id, 0),
            'is_current_user': True
        }

    # Fetch domains for filters
    all_domains = supabase.table('domains').select('id, name, icon').eq('is_active', True).order('name').execute()

    return jsonify({
        'success': True,
        'data': {
            'leaderboard': ranked_list[:limit],
            'user_standing': user_rank,
            'total_founders': len(founders),
            'current_domain': {
                'id': user_domain_id,
                'name': user_profile.get('domains', {}).get('name') if user_profile.get('domains') else None
            },
            'domains': all_domains.data or []
        }
    }), 200
