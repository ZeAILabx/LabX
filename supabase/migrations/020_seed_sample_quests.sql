-- ============================================================
-- 020_seed_sample_quests.sql — Seed sample quests for testing
-- Quests are attached to Healthcare & MedTech -> Discover -> Level 1 -> Milestone 1
-- ============================================================

DO $$
DECLARE
    h_domain_id UUID;
    d_stage_id UUID;
    l1_level_id UUID;
    m1_milestone_id UUID;
BEGIN
    -- Get Healthcare & MedTech domain
    SELECT id INTO h_domain_id FROM domains WHERE name = 'Healthcare & MedTech';
    
    -- Get Discover stage
    SELECT id INTO d_stage_id FROM stages WHERE name = 'Discover';
    
    -- Get Level 1 for Discover stage
    SELECT id INTO l1_level_id FROM levels WHERE stage_id = d_stage_id AND level_order = 1;
    
    -- Get Milestone 1 for Healthcare & Discover & Level 1
    SELECT id INTO m1_milestone_id FROM milestones 
    WHERE domain_id = h_domain_id AND level_id = l1_level_id AND milestone_order = 1;

    IF m1_milestone_id IS NOT NULL THEN
        -- Core Quest 1
        INSERT INTO quests (
            title, description, instructions, objective, expected_output,
            domain_id, stage_id, level_id, milestone_id,
            quest_type, difficulty, points, mandatory, submission_type,
            verification_required, quest_order, is_seed_data
        ) VALUES (
            'Define Healthcare Problem',
            'Clearly articulate the healthcare or medtech problem you are solving.',
            'Document the background, pain points, who suffers from this problem, and current inadequate solutions.',
            'Create a comprehensive problem statement document with root cause analysis.',
            'A 1-2 page PDF document or link to Notion page detailing the problem definition.',
            h_domain_id, d_stage_id, l1_level_id, m1_milestone_id,
            'core', 'easy', 100, true, 'text',
            true, 1, true
        );

        -- Core Quest 2
        INSERT INTO quests (
            title, description, instructions, objective, expected_output,
            domain_id, stage_id, level_id, milestone_id,
            quest_type, difficulty, points, mandatory, submission_type,
            verification_required, quest_order, is_seed_data
        ) VALUES (
            'Identify Target Users',
            'Identify the specific patient demographics, healthcare providers, or clinical users affected.',
            'List buyer personas, end-user personas, hospital decision makers, and key stakeholders.',
            'Define 2 detailed buyer/user personas including demographics, pain points, and workflows.',
            'User persona document with user journey mapping.',
            h_domain_id, d_stage_id, l1_level_id, m1_milestone_id,
            'core', 'medium', 100, true, 'url',
            true, 2, true
        );

        -- Side Quest 1
        INSERT INTO quests (
            title, description, instructions, objective, expected_output,
            domain_id, stage_id, level_id, milestone_id,
            quest_type, difficulty, points, mandatory, submission_type,
            verification_required, quest_order, is_seed_data
        ) VALUES (
            'Research 5 Competitors',
            'Conduct a competitive analysis of existing solutions in your healthcare niche.',
            'Identify 5 existing products or incumbent solutions. Benchmark features, pricing, and drawbacks.',
            'Build a competitive matrix comparing your value proposition against competitors.',
            'Spreadsheet link or PDF of competitive matrix.',
            h_domain_id, d_stage_id, l1_level_id, m1_milestone_id,
            'side', 'medium', 50, false, 'url',
            true, 3, true
        );
    END IF;
END $$;
