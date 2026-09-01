"""
Progress Blueprint — Founder progress summary endpoint.
"""
from flask import Blueprint, jsonify, g
from app import get_supabase
from app.middleware.auth import require_founder

progress_bp = Blueprint('progress', __name__)


@progress_bp.route('', methods=['GET', 'OPTIONS'])
@require_founder
def get_founder_progress():
    """
    Get comprehensive founder progress for Dashboard:
    - Domain, Stage, Level, Milestone details
    - LABX Points total
    - Overall completion percentage
    - Current milestone progress & core quests completed
    - Primary CTA (Continue Current Quest)
    """
    user_id = g.current_user['id']
    supabase = get_supabase()

    # Get founder profile
    profile = supabase.table('profiles').select(
        '*, domains(name), guilds(name)'
    ).eq('id', user_id).execute()

    if not profile.data or not profile.data[0].get('domain_id'):
        return jsonify({'success': False, 'message': 'Founder assessment incomplete'}), 400

    profile_data = profile.data[0]
    domain_id = profile_data['domain_id']

    # Get founder progress record
    fp = supabase.table('founder_progress').select(
        '*, stages(name, stage_order), levels(name, level_order), milestones(id, name, milestone_order)'
    ).eq('user_id', user_id).execute()

    fp_data = fp.data[0] if fp.data else {}

    # Get current milestone details & quests
    current_milestone_id = fp_data.get('current_milestone_id')
    milestone_info = None
    next_quest = None
    milestone_progress_pct = 0
    core_completed = 0
    core_total = 0

    if current_milestone_id:
        ms = supabase.table('milestones').select(
            '*, levels(name), stages(name)'
        ).eq('id', current_milestone_id).execute()
        milestone_info = ms.data[0] if ms.data else None

        # Get milestone progress record
        mp = supabase.table('milestone_progress').select('*').eq(
            'user_id', user_id
        ).eq('milestone_id', current_milestone_id).execute()

        if mp.data:
            milestone_progress_pct = mp.data[0].get('progress_percentage', 0)
            core_completed = mp.data[0].get('completed_quests', 0)
            core_total = mp.data[0].get('total_quests', 0)

        # Get next available quest to continue
        quests = supabase.table('quests').select('*').eq(
            'milestone_id', current_milestone_id
        ).eq('is_active', True).order('quest_order').execute()

        # Find first non-completed quest
        if quests.data:
            q_ids = [q['id'] for q in quests.data]
            subs = supabase.table('quest_submissions').select('quest_id, status').eq(
                'user_id', user_id
            ).in_('quest_id', q_ids).execute()
            
            sub_map = {s['quest_id']: s['status'] for s in (subs.data or [])}
            
            # Total core count
            core_total = len([q for q in quests.data if q['quest_type'] == 'core' and q['mandatory']])
            core_completed = len([q for q in quests.data if q['quest_type'] == 'core' and q['mandatory'] and sub_map.get(q['id']) in ['approved', 'completed']])

            for q in quests.data:
                status = sub_map.get(q['id'])
                if status not in ['approved', 'completed', 'under_review']:
                    next_quest = q
                    break

    # Calculate overall roadmap percentage
    # Total milestones for domain = 75 (5 stages * 5 levels * 3 milestones)
    completed_ms_cnt = supabase.table('milestone_progress').select(
        'id', count='exact'
    ).eq('user_id', user_id).eq('is_completed', True).execute()

    overall_progress_pct = round(((completed_ms_cnt.count or 0) / 75.0) * 100)

    return jsonify({
        'success': True,
        'data': {
            'profile': profile_data,
            'current_stage': fp_data.get('stages'),
            'current_level': fp_data.get('levels'),
            'current_milestone': milestone_info,
            'milestone_progress_percentage': milestone_progress_pct,
            'core_quests_completed': core_completed,
            'core_quests_total': core_total,
            'overall_progress_percentage': overall_progress_pct,
            'total_points': profile_data.get('total_points', 0),
            'next_quest': next_quest,
            'roadmap_completed': fp_data.get('roadmap_completed', False)
        }
    }), 200
