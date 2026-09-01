"""
Assessment Blueprint — Handles one-time founder assessment processing.
"""
from flask import Blueprint, request, jsonify, g
from app import get_supabase
from app.middleware.auth import require_founder
from app.services.assessment_engine import process_assessment

assessment_bp = Blueprint('assessment', __name__)


@assessment_bp.route('/status', methods=['GET', 'OPTIONS'])
@require_founder
def get_assessment_status():
    """Check if the current founder has completed assessment."""
    user_id = g.current_user['id']
    supabase = get_supabase()

    profile = supabase.table('profiles').select(
        'assessment_completed, domain_id, guild_id'
    ).eq('id', user_id).execute()

    if not profile.data:
        return jsonify({'success': False, 'message': 'Profile not found'}), 404

    completed = profile.data[0].get('assessment_completed', False)

    assessment_data = None
    if completed:
        rec = supabase.table('founder_assessments').select('*').eq('user_id', user_id).execute()
        assessment_data = rec.data[0] if rec.data else None

    return jsonify({
        'success': True,
        'data': {
            'completed': completed,
            'assessment': assessment_data
        }
    }), 200


@assessment_bp.route('/submit', methods=['POST', 'OPTIONS'])
@require_founder
def submit_assessment():
    """
    Process one-time assessment.
    Determines Domain, Stage, Level, auto-assigns Guild, creates Founder Progress.
    """
    user_id = g.current_user['id']
    supabase = get_supabase()

    # Check if already completed
    profile = supabase.table('profiles').select('assessment_completed').eq('id', user_id).execute()
    if profile.data and profile.data[0].get('assessment_completed'):
        return jsonify({
            'success': False,
            'message': 'Assessment has already been completed'
        }), 400

    data = request.json or {}
    
    # Required answers: q1..q7
    for key in ['q1', 'q2', 'q4', 'q5', 'q6', 'q7']:
        if key not in data:
            return jsonify({'success': False, 'message': f'Missing required answer: {key}'}), 400

    try:
        # Run deterministic engine
        result = process_assessment(data)

        # Lookup domain record
        domain_rec = supabase.table('domains').select('id, name').eq('name', result['domain']).execute()
        if not domain_rec.data:
            return jsonify({'success': False, 'message': f"Domain '{result['domain']}' not found in database"}), 500
        domain_id = domain_rec.data[0]['id']

        # Lookup stage record
        stage_rec = supabase.table('stages').select('id, name').eq('name', result['stage']).execute()
        if not stage_rec.data:
            return jsonify({'success': False, 'message': f"Stage '{result['stage']}' not found in database"}), 500
        stage_id = stage_rec.data[0]['id']

        # Lookup level record
        level_rec = supabase.table('levels').select('id, name').eq('stage_id', stage_id).eq('level_order', result['level']).execute()
        if not level_rec.data:
            return jsonify({'success': False, 'message': f"Level {result['level']} for stage '{result['stage']}' not found"}), 500
        level_id = level_rec.data[0]['id']

        # Find first milestone of starting level
        ms_rec = supabase.table('milestones').select('id').eq('domain_id', domain_id).eq('level_id', level_id).eq('milestone_order', 1).execute()
        milestone_id = ms_rec.data[0]['id'] if ms_rec.data else None

        # Auto Guild Assignment
        guild_rec = supabase.table('guilds').select('id, name').eq('domain_id', domain_id).execute()
        guild_id = guild_rec.data[0]['id'] if guild_rec.data else None
        guild_name = guild_rec.data[0]['name'] if guild_rec.data else None

        # 1. Save Assessment Response
        supabase.table('founder_assessments').insert({
            'user_id': user_id,
            'q1_domain': data['q1'],
            'q2_project_state': data['q2'],
            'q3_evidence': data.get('q3', []),
            'q4_execution': data['q4'],
            'q5_validation': data['q5'],
            'q6_product_maturity': data['q6'],
            'q7_completed_work': data['q7'],
            'calculated_domain': result['domain'],
            'calculated_stage': result['stage'],
            'calculated_level': result['level'],
            'level_score': result['level_score'],
            'domain_id': domain_id,
            'stage_id': stage_id,
            'level_id': level_id
        }).execute()

        # 2. Update Profile (mark assessment completed, assign domain & guild)
        supabase.table('profiles').update({
            'domain_id': domain_id,
            'guild_id': guild_id,
            'assessment_completed': True
        }).eq('id', user_id).execute()

        # 3. Add to Guild Members
        if guild_id:
            supabase.table('guild_members').upsert({
                'guild_id': guild_id,
                'user_id': user_id
            }, on_conflict='guild_id,user_id').execute()

        # 4. Create Founder Progress Record
        supabase.table('founder_progress').upsert({
            'user_id': user_id,
            'domain_id': domain_id,
            'current_stage_id': stage_id,
            'current_level_id': level_id,
            'current_milestone_id': milestone_id,
            'roadmap_completed': False
        }, on_conflict='user_id').execute()

        # 5. Initialize Stage & Level & Milestone progress as unlocked
        supabase.table('stage_progress').upsert({
            'user_id': user_id,
            'stage_id': stage_id,
            'is_unlocked': True
        }, on_conflict='user_id,stage_id').execute()

        supabase.table('level_progress').upsert({
            'user_id': user_id,
            'level_id': level_id,
            'is_unlocked': True
        }, on_conflict='user_id,level_id').execute()

        if milestone_id:
            supabase.table('milestone_progress').upsert({
                'user_id': user_id,
                'milestone_id': milestone_id,
                'is_unlocked': True
            }, on_conflict='user_id,milestone_id').execute()

        # Send welcome notification
        supabase.table('notifications').insert({
            'user_id': user_id,
            'type': 'welcome',
            'title': 'Welcome to LABX!',
            'message': f"Assigned to {result['domain']} Domain and {guild_name}."
        }).execute()

        return jsonify({
            'success': True,
            'data': {
                'domain': result['domain'],
                'stage': result['stage'],
                'level': result['level'],
                'guild': guild_name,
                'guild_id': guild_id
            }
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
