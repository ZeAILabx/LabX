"""
Progression Engine — Handles milestone, level, and stage progression.
All progression logic runs server-side.
"""
from app import get_supabase


def check_milestone_completion(user_id: str, milestone_id: str) -> bool:
    """
    Check if all mandatory core quests in a milestone are completed/approved.
    Side quests do NOT block progression.
    """
    supabase = get_supabase()

    # Get all core quests for this milestone
    core_quests = supabase.table('quests').select('id').eq(
        'milestone_id', milestone_id
    ).eq('quest_type', 'core').eq('mandatory', True).eq('is_active', True).execute()

    if not core_quests.data:
        return False  # No core quests means milestone can't be completed

    core_quest_ids = [q['id'] for q in core_quests.data]

    # Check which ones are completed/approved by this user
    completed = supabase.table('quest_submissions').select('quest_id').eq(
        'user_id', user_id
    ).in_('status', ['approved', 'completed']).in_('quest_id', core_quest_ids).execute()

    completed_ids = set(s['quest_id'] for s in (completed.data or []))

    return all(qid in completed_ids for qid in core_quest_ids)


def update_milestone_progress(user_id: str, milestone_id: str):
    """Update milestone progress and check completion."""
    supabase = get_supabase()

    # Count total and completed core quests
    core_quests = supabase.table('quests').select('id').eq(
        'milestone_id', milestone_id
    ).eq('quest_type', 'core').eq('mandatory', True).eq('is_active', True).execute()

    total = len(core_quests.data) if core_quests.data else 0

    if total == 0:
        return

    core_quest_ids = [q['id'] for q in core_quests.data]
    completed = supabase.table('quest_submissions').select('quest_id').eq(
        'user_id', user_id
    ).in_('status', ['approved', 'completed']).in_('quest_id', core_quest_ids).execute()

    completed_count = len(completed.data) if completed.data else 0
    is_complete = completed_count >= total
    progress_pct = round((completed_count / total) * 100) if total > 0 else 0

    # Upsert milestone progress
    supabase.table('milestone_progress').upsert({
        'user_id': user_id,
        'milestone_id': milestone_id,
        'completed_quests': completed_count,
        'total_quests': total,
        'progress_percentage': progress_pct,
        'is_completed': is_complete,
    }, on_conflict='user_id,milestone_id').execute()

    if is_complete:
        from app.services.achievements_engine import award_achievement
        award_achievement(user_id, 'first_milestone')
        _unlock_next_milestone(user_id, milestone_id)
        _check_level_completion(user_id, milestone_id)

    return is_complete


def _unlock_next_milestone(user_id: str, completed_milestone_id: str):
    """Unlock the next milestone in sequence."""
    supabase = get_supabase()

    # Get the completed milestone details
    milestone = supabase.table('milestones').select(
        'domain_id, level_id, milestone_order'
    ).eq('id', completed_milestone_id).execute()

    if not milestone.data:
        return

    domain_id = milestone.data[0]['domain_id']
    level_id = milestone.data[0]['level_id']
    current_order = milestone.data[0]['milestone_order']

    # Find the next milestone in this level for the same domain
    next_milestone = supabase.table('milestones').select('id').eq(
        'domain_id', domain_id
    ).eq('level_id', level_id).eq('milestone_order', current_order + 1).execute()

    if next_milestone.data:
        next_ms_id = next_milestone.data[0]['id']
        # Create progress record for next milestone (marks it as available)
        supabase.table('milestone_progress').upsert({
            'user_id': user_id,
            'milestone_id': next_ms_id,
            'is_unlocked': True,
            'completed_quests': 0,
            'total_quests': 0,
            'progress_percentage': 0,
            'is_completed': False,
        }, on_conflict='user_id,milestone_id').execute()


def _check_level_completion(user_id: str, milestone_id: str):
    """Check if all milestones in a level are complete and unlock next level."""
    supabase = get_supabase()

    # Get the level for this milestone
    milestone = supabase.table('milestones').select('domain_id, level_id').eq(
        'id', milestone_id
    ).execute()

    if not milestone.data:
        return

    domain_id = milestone.data[0]['domain_id']
    level_id = milestone.data[0]['level_id']

    # Get all milestones for this level and domain
    all_milestones = supabase.table('milestones').select('id').eq(
        'domain_id', domain_id
    ).eq('level_id', level_id).execute()

    if not all_milestones.data:
        return

    milestone_ids = [m['id'] for m in all_milestones.data]

    # Check if all are completed
    completed_milestones = supabase.table('milestone_progress').select('milestone_id').eq(
        'user_id', user_id
    ).eq('is_completed', True).in_('milestone_id', milestone_ids).execute()

    if len(completed_milestones.data or []) >= len(milestone_ids):
        # Level is complete
        from app.services.achievements_engine import award_achievement
        award_achievement(user_id, 'first_level')

        supabase.table('level_progress').upsert({
            'user_id': user_id,
            'level_id': level_id,
            'is_completed': True,
        }, on_conflict='user_id,level_id').execute()

        _unlock_next_level(user_id, domain_id, level_id)


def _unlock_next_level(user_id: str, domain_id: str, completed_level_id: str):
    """Unlock the next level or next stage."""
    supabase = get_supabase()

    # Get level details
    level = supabase.table('levels').select(
        'stage_id, level_order'
    ).eq('id', completed_level_id).execute()

    if not level.data:
        return

    stage_id = level.data[0]['stage_id']
    current_order = level.data[0]['level_order']

    # Try next level in same stage
    next_level = supabase.table('levels').select('id').eq(
        'stage_id', stage_id
    ).eq('level_order', current_order + 1).execute()

    if next_level.data:
        next_lvl_id = next_level.data[0]['id']
        # Unlock next level
        supabase.table('level_progress').upsert({
            'user_id': user_id,
            'level_id': next_lvl_id,
            'is_unlocked': True,
            'is_completed': False,
        }, on_conflict='user_id,level_id').execute()

        # Unlock first milestone of new level for this domain
        first_milestone = supabase.table('milestones').select('id').eq(
            'domain_id', domain_id
        ).eq('level_id', next_lvl_id).eq('milestone_order', 1).execute()

        if first_milestone.data:
            supabase.table('milestone_progress').upsert({
                'user_id': user_id,
                'milestone_id': first_milestone.data[0]['id'],
                'is_unlocked': True,
                'completed_quests': 0,
                'total_quests': 0,
                'progress_percentage': 0,
                'is_completed': False,
            }, on_conflict='user_id,milestone_id').execute()

        # Update founder's current level
        supabase.table('founder_progress').update({
            'current_level_id': next_lvl_id,
        }).eq('user_id', user_id).execute()
    else:
        # All levels in stage complete — check stage completion
        _check_stage_completion(user_id, domain_id, stage_id)


def _check_stage_completion(user_id: str, domain_id: str, stage_id: str):
    """Complete a stage and unlock next stage."""
    supabase = get_supabase()

    from app.services.achievements_engine import award_achievement
    award_achievement(user_id, 'first_stage')

    supabase.table('stage_progress').upsert({
        'user_id': user_id,
        'stage_id': stage_id,
        'is_completed': True,
    }, on_conflict='user_id,stage_id').execute()

    # Get stage details
    stage = supabase.table('stages').select('stage_order').eq(
        'id', stage_id
    ).execute()

    if not stage.data:
        return

    current_order = stage.data[0]['stage_order']

    # Find next stage
    next_stage = supabase.table('stages').select('id').eq(
        'stage_order', current_order + 1
    ).execute()

    if next_stage.data:
        next_stg_id = next_stage.data[0]['id']
        # Unlock next stage
        supabase.table('stage_progress').upsert({
            'user_id': user_id,
            'stage_id': next_stg_id,
            'is_unlocked': True,
            'is_completed': False,
        }, on_conflict='user_id,stage_id').execute()

        first_level = supabase.table('levels').select('id').eq(
            'stage_id', next_stg_id
        ).eq('level_order', 1).execute()

        if first_level.data:
            first_lvl_id = first_level.data[0]['id']
            supabase.table('level_progress').upsert({
                'user_id': user_id,
                'level_id': first_lvl_id,
                'is_unlocked': True,
                'is_completed': False,
            }, on_conflict='user_id,level_id').execute()

            # Unlock first milestone for this domain
            first_ms = supabase.table('milestones').select('id').eq(
                'domain_id', domain_id
            ).eq('level_id', first_lvl_id).eq('milestone_order', 1).execute()

            if first_ms.data:
                supabase.table('milestone_progress').upsert({
                    'user_id': user_id,
                    'milestone_id': first_ms.data[0]['id'],
                    'is_unlocked': True,
                    'completed_quests': 0,
                    'total_quests': 0,
                    'progress_percentage': 0,
                    'is_completed': False,
                }, on_conflict='user_id,milestone_id').execute()

            # Update founder progress
            supabase.table('founder_progress').update({
                'current_stage_id': next_stg_id,
                'current_level_id': first_lvl_id,
            }).eq('user_id', user_id).execute()
    else:
        # All stages complete — roadmap finished!
        supabase.table('founder_progress').update({
            'roadmap_completed': True,
        }).eq('user_id', user_id).execute()

        # Award achievement
        _award_achievement(user_id, 'roadmap_completed')


def _award_achievement(user_id: str, achievement_key: str):
    """Award an achievement to a user if not already earned."""
    supabase = get_supabase()

    achievement = supabase.table('achievements').select('id').eq(
        'key', achievement_key
    ).execute()

    if achievement.data:
        # Check if already awarded
        existing = supabase.table('founder_achievements').select('id').eq(
            'user_id', user_id
        ).eq('achievement_id', achievement.data[0]['id']).execute()

        if not existing.data:
            supabase.table('founder_achievements').insert({
                'user_id': user_id,
                'achievement_id': achievement.data[0]['id'],
            }).execute()

            # Send notification
            supabase.table('notifications').insert({
                'user_id': user_id,
                'type': 'achievement_unlocked',
                'title': 'Achievement Unlocked!',
                'message': f'You earned a new achievement!',
                'data': {'achievement_id': achievement.data[0]['id']},
            }).execute()
