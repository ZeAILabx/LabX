"""
Roadmap Blueprint — Serves founder's domain roadmap tree & progression status.
"""
from flask import Blueprint, jsonify, g
from app import get_supabase
from app.middleware.auth import require_founder

roadmap_bp = Blueprint('roadmap', __name__)


@roadmap_bp.route('', methods=['GET', 'OPTIONS'])
@require_founder
def get_roadmap():
    """
    Get full roadmap hierarchy for founder's Domain:
    Domain -> 5 Stages -> 5 Levels each -> 3 Milestones each.
    Includes unlock status and completion status for every node.
    """
    user_id = g.current_user['id']
    supabase = get_supabase()

    # Get founder profile & domain
    profile = supabase.table('profiles').select('domain_id').eq('id', user_id).execute()
    if not profile.data or not profile.data[0].get('domain_id'):
        return jsonify({'success': False, 'message': 'Founder domain not set. Complete assessment first.'}), 400

    domain_id = profile.data[0]['domain_id']

    # Get domain info
    domain = supabase.table('domains').select('*').eq('id', domain_id).execute()
    domain_data = domain.data[0] if domain.data else None
    
    # Get all stages
    stages = supabase.table('stages').select('*').order('stage_order').execute()
    
    # Get all levels for these stages
    levels = supabase.table('levels').select('*').order('level_order').execute()

    # Get all milestones for this domain
    milestones = supabase.table('milestones').select('*').eq('domain_id', domain_id).order('milestone_order').execute()

    # Get user progress statuses
    fp = supabase.table('founder_progress').select('*').eq('user_id', user_id).execute()
    fp_data = fp.data[0] if fp.data else {}
    stage_prog = supabase.table('stage_progress').select('*').eq('user_id', user_id).execute()
    level_prog = supabase.table('level_progress').select('*').eq('user_id', user_id).execute()
    ms_prog = supabase.table('milestone_progress').select('*').eq('user_id', user_id).execute()

    # Map progress for quick lookup
    stage_prog_map = {p['stage_id']: p for p in (stage_prog.data or [])}
    level_prog_map = {p['level_id']: p for p in (level_prog.data or [])}
    ms_prog_map = {p['milestone_id']: p for p in (ms_prog.data or [])}

    # Group milestones by level_id
    ms_by_level = {}
    for m in (milestones.data or []):
        lid = m['level_id']
        if lid not in ms_by_level:
            ms_by_level[lid] = []
        
        mp = ms_prog_map.get(m['id'], {})
        m_copy = dict(m)
        m_copy['is_unlocked'] = mp.get('is_unlocked', False)
        m_copy['is_completed'] = mp.get('is_completed', False)
        m_copy['progress_percentage'] = mp.get('progress_percentage', 0)
        m_copy['completed_quests'] = mp.get('completed_quests', 0)
        m_copy['total_quests'] = mp.get('total_quests', 0)
        ms_by_level[lid].append(m_copy)

    # Group levels by stage_id
    levels_by_stage = {}
    for l in (levels.data or []):
        sid = l['stage_id']
        if sid not in levels_by_stage:
            levels_by_stage[sid] = []

        lp = level_prog_map.get(l['id'], {})
        l_copy = dict(l)
        l_copy['is_unlocked'] = lp.get('is_unlocked', False)
        l_copy['is_completed'] = lp.get('is_completed', False)
        l_copy['milestones'] = ms_by_level.get(l['id'], [])
        levels_by_stage[sid].append(l_copy)

    # Assemble stages tree
    stages_tree = []
    for s in (stages.data or []):
        sp = stage_prog_map.get(s['id'], {})
        s_copy = dict(s)
        s_copy['is_unlocked'] = sp.get('is_unlocked', False)
        s_copy['is_completed'] = sp.get('is_completed', False)
        s_copy['levels'] = levels_by_stage.get(s['id'], [])
        stages_tree.append(s_copy)

    return jsonify({
        'success': True,
        'data': {
            'domain': domain_data,
            'current_location': fp_data,
            'stages': stages_tree
        }
    }), 200
