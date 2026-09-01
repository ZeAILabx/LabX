"""
Auth Blueprint — Authentication endpoints using Supabase Auth.
"""
from flask import Blueprint, request, jsonify, g
from app import get_supabase
from app.middleware.auth import require_auth

auth_bp = Blueprint('auth', __name__)


@auth_bp.before_request
def handle_options():
    if request.method == 'OPTIONS':
        return '', 200


@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    """Register a new founder using Supabase Auth (auto-confirms email so session is immediate)."""
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400

    try:
        supabase = get_supabase()

        # Use admin.create_user with email_confirm=True so session is returned immediately
        try:
            admin_res = supabase.auth.admin.create_user({
                'email': email,
                'password': password,
                'email_confirm': True,
                'user_metadata': {
                    'full_name': full_name
                }
            })
            user_id = admin_res.user.id if admin_res and admin_res.user else None
        except Exception as create_err:
            # If user already exists in auth, try to find their ID
            error_str = str(create_err)
            if 'already been registered' in error_str or 'already exists' in error_str:
                return jsonify({'success': False, 'message': 'An account with this email already exists. Please sign in.'}), 409
            raise create_err

        if not user_id:
            return jsonify({'success': False, 'message': 'Registration failed'}), 400

        # Ensure profile exists in profiles table
        profile = supabase.table('profiles').select('*').eq('id', user_id).execute()
        if not profile.data:
            supabase.table('profiles').insert({
                'id': user_id,
                'email': email,
                'full_name': full_name,
                'role': 'founder',
                'assessment_completed': False
            }).execute()

        # Now sign in to get a valid session/access_token
        sign_in_res = supabase.auth.sign_in_with_password({
            'email': email,
            'password': password
        })

        session_data = {
            'user': {
                'id': user_id,
                'email': email,
                'full_name': full_name,
                'role': 'founder',
                'assessment_completed': False
            },
            'access_token': sign_in_res.session.access_token if sign_in_res.session else None
        }

        return jsonify({'success': True, 'data': session_data}), 201

    except Exception as e:
        error_msg = str(e)
        if 'already been registered' in error_msg or 'already exists' in error_msg or 'unique' in error_msg.lower():
            return jsonify({'success': False, 'message': 'An account with this email already exists. Please sign in.'}), 409
        return jsonify({'success': False, 'message': error_msg}), 500


@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    """Log in an existing user with auto-confirmation fallback."""
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password required'}), 400

    supabase = get_supabase()

    try:
        try:
            res = supabase.auth.sign_in_with_password({
                'email': email,
                'password': password
            })
        except Exception as sign_in_err:
            err_str = str(sign_in_err)
            # If email is not confirmed, auto-confirm it via admin API and retry
            if 'email not confirmed' in err_str.lower():
                users = supabase.auth.admin.list_users()
                target_user = next((u for u in users if u.email and u.email.lower() == email.lower()), None)
                if target_user:
                    supabase.auth.admin.update_user_by_id(target_user.id, {'email_confirm': True})
                    res = supabase.auth.sign_in_with_password({
                        'email': email,
                        'password': password
                    })
                else:
                    raise sign_in_err
            else:
                raise sign_in_err

        if not res.user or not res.session:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        user_id = res.user.id
        profile_res = supabase.table('profiles').select('*').eq('id', user_id).execute()
        
        if profile_res.data:
            profile = profile_res.data[0]
        else:
            # Auto-create profile if missing
            new_prof = supabase.table('profiles').insert({
                'id': user_id,
                'email': res.user.email,
                'full_name': res.user.user_metadata.get('full_name', '') if res.user.user_metadata else '',
                'role': 'founder',
                'assessment_completed': False
            }).execute()
            profile = new_prof.data[0] if new_prof.data else {}

        return jsonify({
            'success': True,
            'data': {
                'user': {
                    'id': user_id,
                    'email': res.user.email,
                    'full_name': profile.get('full_name', ''),
                    'role': profile.get('role', 'founder'),
                    'domain_id': profile.get('domain_id'),
                    'guild_id': profile.get('guild_id'),
                    'assessment_completed': profile.get('assessment_completed', False)
                },
                'access_token': res.session.access_token
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 401


@auth_bp.route('/me', methods=['GET', 'OPTIONS'])
@require_auth
def get_me():
    """Get current authenticated user info."""
    user = g.current_user
    return jsonify({'success': True, 'data': user}), 200


@auth_bp.route('/forgot-password', methods=['POST', 'OPTIONS'])
def forgot_password():
    """Send password reset email."""
    data = request.json or {}
    email = data.get('email')

    if not email:
        return jsonify({'success': False, 'message': 'Email required'}), 400

    try:
        supabase = get_supabase()
        supabase.auth.reset_password_for_email(email)
        return jsonify({'success': True, 'message': 'Password reset link sent'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

