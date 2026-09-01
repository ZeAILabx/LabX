"""Authentication and authorization middleware for Flask routes."""
import functools
from flask import request, jsonify, g
from app import get_supabase


def get_current_user():
    """Extract and verify user from Authorization header using Supabase."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header.split('Bearer ')[1]
    try:
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            user = user_response.user
            # Fetch profile to get role safely without .single()
            profile_res = supabase.table('profiles').select('*').eq('id', user.id).execute()
            if profile_res.data:
                profile_data = profile_res.data[0]
                return {
                    'id': user.id,
                    'email': user.email,
                    'role': profile_data.get('role', 'founder'),
                    'assessment_completed': profile_data.get('assessment_completed', False),
                    'domain_id': profile_data.get('domain_id'),
                    'guild_id': profile_data.get('guild_id'),
                    'profile': profile_data
                }
            else:
                # Profile doesn't exist yet, insert it
                try:
                    new_prof = supabase.table('profiles').insert({
                        'id': user.id,
                        'email': user.email,
                        'full_name': user.user_metadata.get('full_name', '') if user.user_metadata else '',
                        'role': 'founder',
                        'assessment_completed': False
                    }).execute()
                    profile_data = new_prof.data[0] if new_prof.data else {'role': 'founder', 'assessment_completed': False}
                except Exception:
                    profile_data = {'role': 'founder', 'assessment_completed': False}

                return {
                    'id': user.id,
                    'email': user.email,
                    'role': profile_data.get('role', 'founder'),
                    'assessment_completed': profile_data.get('assessment_completed', False),
                    'domain_id': profile_data.get('domain_id'),
                    'guild_id': profile_data.get('guild_id'),
                    'profile': profile_data
                }
        return None
    except Exception as e:
        print(f"Auth error: {e}")
        return None


def require_auth(f):
    """Decorator to require authentication."""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({
                'success': False,
                'message': 'Authentication required',
                'error': 'unauthorized'
            }), 401
        g.current_user = user
        return f(*args, **kwargs)
    return decorated


def require_founder(f):
    """Decorator to require founder role."""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({
                'success': False,
                'message': 'Authentication required',
                'error': 'unauthorized'
            }), 401
        if user['role'] != 'founder':
            return jsonify({
                'success': False,
                'message': 'Founder access required',
                'error': 'forbidden'
            }), 403
        g.current_user = user
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    """Decorator to require admin role."""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({
                'success': False,
                'message': 'Authentication required',
                'error': 'unauthorized'
            }), 401
        if user['role'] != 'admin':
            return jsonify({
                'success': False,
                'message': 'Admin access required',
                'error': 'forbidden'
            }), 403
        g.current_user = user
        return f(*args, **kwargs)
    return decorated
