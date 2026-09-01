"""
Points Blueprint — Points history and leaderboard.
"""
from flask import Blueprint, request, jsonify, g
from app.middleware.auth import require_founder
from app.services.points_engine import get_points_history, get_total_points

points_bp = Blueprint('points', __name__)


@points_bp.route('', methods=['GET', 'OPTIONS'])
@require_founder
def get_points():
    """Get current user's total points and recent transactions."""
    user_id = g.current_user['id']
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    total = get_total_points(user_id)
    history = get_points_history(user_id, page, per_page)

    return jsonify({
        'success': True,
        'data': {
            'total_points': total,
            'history': history['transactions'],
            'page': history['page'],
            'per_page': history['per_page']
        }
    }), 200
