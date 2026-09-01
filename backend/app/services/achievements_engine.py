"""
Achievements Engine — Automatically evaluates and awards founder achievements and badges.
"""
from app import get_supabase


def award_achievement(user_id: str, achievement_key: str):
    """Award an achievement to a user if not already earned."""
    try:
        supabase = get_supabase()
        achievement = supabase.table('achievements').select('id, name, icon').eq(
            'key', achievement_key
        ).execute()

        if not achievement.data:
            return None

        ach = achievement.data[0]
        ach_id = ach['id']

        # Check if already awarded
        existing = supabase.table('founder_achievements').select('id').eq(
            'user_id', user_id
        ).eq('achievement_id', ach_id).execute()

        if not existing.data:
            supabase.table('founder_achievements').insert({
                'user_id': user_id,
                'achievement_id': ach_id,
            }).execute()

            # Send notification
            try:
                supabase.table('notifications').insert({
                    'user_id': user_id,
                    'type': 'achievement_unlocked',
                    'title': f'Badge Unlocked: {ach.get("name", "Achievement")}! {ach.get("icon", "🏆")}',
                    'message': f'Congratulations! You earned the "{ach.get("name")}" badge.',
                    'data': {'achievement_id': ach_id, 'key': achievement_key},
                }).execute()
            except Exception as notif_err:
                print(f"Failed to create achievement notification: {notif_err}")

            return ach
        return None
    except Exception as err:
        print(f"Error awarding achievement {achievement_key} to {user_id}: {err}")
        return None


def check_and_award_quest_achievements(user_id: str):
    """Check achievements related to completed quests."""
    supabase = get_supabase()
    res = supabase.table('quest_submissions').select('id', count='exact').eq(
        'user_id', user_id
    ).in_('status', ['approved', 'completed']).execute()

    count = res.count or 0
    if count >= 1:
        award_achievement(user_id, 'first_quest')
    if count >= 10:
        award_achievement(user_id, 'quests_10')
    if count >= 50:
        award_achievement(user_id, 'quests_50')


def check_and_award_points_achievements(user_id: str, total_points: int = None):
    """Check achievements related to points milestones."""
    supabase = get_supabase()
    if total_points is None:
        prof = supabase.table('profiles').select('total_points').eq('id', user_id).execute()
        total_points = prof.data[0].get('total_points', 0) if prof.data else 0

    if total_points >= 100:
        award_achievement(user_id, 'points_100')
    if total_points >= 500:
        award_achievement(user_id, 'points_500')
    if total_points >= 1000:
        award_achievement(user_id, 'points_1000')


def check_and_award_milestone_achievements(user_id: str):
    """Check achievements related to milestone/level/stage completion."""
    supabase = get_supabase()
    ms_res = supabase.table('milestone_progress').select('id', count='exact').eq('user_id', user_id).eq('is_completed', True).execute()
    if (ms_res.count or 0) >= 1:
        award_achievement(user_id, 'first_milestone')

    lvl_res = supabase.table('level_progress').select('id', count='exact').eq('user_id', user_id).eq('is_completed', True).execute()
    if (lvl_res.count or 0) >= 1:
        award_achievement(user_id, 'first_level')

    stg_res = supabase.table('stage_progress').select('id', count='exact').eq('user_id', user_id).eq('is_completed', True).execute()
    if (stg_res.count or 0) >= 1:
        award_achievement(user_id, 'first_stage')

    fp_res = supabase.table('founder_progress').select('roadmap_completed').eq('user_id', user_id).execute()
    if fp_res.data and fp_res.data[0].get('roadmap_completed'):
        award_achievement(user_id, 'roadmap_completed')


def check_and_award_social_achievements(user_id: str):
    """Check achievements related to social posts and followers."""
    supabase = get_supabase()
    posts_res = supabase.table('posts').select('id', count='exact').eq('author_id', user_id).eq('is_active', True).execute()
    if (posts_res.count or 0) >= 1:
        award_achievement(user_id, 'first_post')

    followers_res = supabase.table('follows').select('id', count='exact').eq('following_id', user_id).execute()
    if (followers_res.count or 0) >= 1:
        award_achievement(user_id, 'first_follower')

    msgs_res = supabase.table('guild_messages').select('id', count='exact').eq('user_id', user_id).execute()
    if (msgs_res.count or 0) >= 1:
        award_achievement(user_id, 'first_guild_message')


def sync_all_user_achievements(user_id: str):
    """Sync and award all eligible achievements for a user."""
    try:
        check_and_award_quest_achievements(user_id)
        check_and_award_points_achievements(user_id)
        check_and_award_milestone_achievements(user_id)
        check_and_award_social_achievements(user_id)
    except Exception as e:
        print(f"Error syncing achievements for user {user_id}: {e}")
