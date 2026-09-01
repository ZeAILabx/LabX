"""
Points Engine — Handles LABX point awards and prevents duplicates.
Points do NOT determine level. They are rewards only.
"""
from app import get_supabase


def award_quest_points(user_id: str, quest_id: str) -> dict:
    """
    Award points for completing a quest.
    Prevents duplicate awards using unique constraint.
    Returns the transaction record or None if already awarded.
    """
    supabase = get_supabase()

    # Check if points already awarded for this quest
    existing = supabase.table('points_transactions').select('id').eq(
        'user_id', user_id
    ).eq('quest_id', quest_id).execute()

    if existing.data:
        return None  # Already awarded

    # Get quest points
    quest = supabase.table('quests').select('points, title').eq(
        'id', quest_id
    ).execute()

    if not quest.data or not quest.data[0].get('points'):
        return None

    points = quest.data[0]['points']

    # Create transaction
    transaction = supabase.table('points_transactions').insert({
        'user_id': user_id,
        'quest_id': quest_id,
        'points': points,
        'transaction_type': 'quest_completion',
    }).execute()

    # Update cached total on profile
    _update_total_points(user_id)

    return transaction.data[0] if transaction.data else None


def _update_total_points(user_id: str):
    """Recalculate and update total points from transactions table."""
    supabase = get_supabase()

    # Sum all points from transactions
    result = supabase.table('points_transactions').select('points').eq(
        'user_id', user_id
    ).execute()

    total = sum(t['points'] for t in (result.data or []))

    supabase.table('profiles').update({
        'total_points': total
    }).eq('id', user_id).execute()

    # Check points achievements
    try:
        from app.services.achievements_engine import check_and_award_points_achievements
        check_and_award_points_achievements(user_id, total)
    except Exception as e:
        print(f"Error checking points achievements: {e}")


def get_points_history(user_id: str, page: int = 1, per_page: int = 20) -> dict:
    """Get paginated points transaction history."""
    supabase = get_supabase()

    offset = (page - 1) * per_page

    result = supabase.table('points_transactions').select(
        '*, quests(title)'
    ).eq('user_id', user_id).order(
        'created_at', desc=True
    ).range(offset, offset + per_page - 1).execute()

    return {
        'transactions': result.data or [],
        'page': page,
        'per_page': per_page,
    }


def get_total_points(user_id: str) -> int:
    """Get total points for a user."""
    supabase = get_supabase()

    profile = supabase.table('profiles').select('total_points').eq(
        'id', user_id
    ).execute()

    return profile.data[0].get('total_points', 0) if profile.data else 0
