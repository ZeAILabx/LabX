-- ============================================================
-- 019_seed_levels_milestones.sql — Generates 900 Milestones
-- 12 Domains × 5 Stages × 5 Levels per Stage × 3 Milestones per Level = 900
-- ============================================================

DO $$
DECLARE
    dom_rec RECORD;
    stg_rec RECORD;
    lvl_rec RECORD;
    m_order INTEGER;
    m_name TEXT;
    m_desc TEXT;
BEGIN
    FOR dom_rec IN SELECT id, name FROM domains LOOP
        FOR stg_rec IN SELECT id, name, stage_order FROM stages LOOP
            FOR lvl_rec IN SELECT id, level_order FROM levels WHERE stage_id = stg_rec.id LOOP
                FOR m_order IN 1..3 LOOP
                    -- Custom descriptive names for milestones
                    IF m_order = 1 THEN
                        m_name := stg_rec.name || ' L' || lvl_rec.level_order || ' - Foundation & Planning';
                    ELSIF m_order = 2 THEN
                        m_name := stg_rec.name || ' L' || lvl_rec.level_order || ' - Execution & Testing';
                    ELSE
                        m_name := stg_rec.name || ' L' || lvl_rec.level_order || ' - Evaluation & Delivery';
                    END IF;

                    m_desc := 'Milestone ' || m_order || ' for level ' || lvl_rec.level_order || ' of ' || stg_rec.name || ' stage in ' || dom_rec.name;

                    INSERT INTO milestones (
                        domain_id,
                        stage_id,
                        level_id,
                        name,
                        description,
                        milestone_order
                    )
                    VALUES (
                        dom_rec.id,
                        stg_rec.id,
                        lvl_rec.id,
                        m_name,
                        m_desc,
                        m_order
                    )
                    ON CONFLICT (domain_id, level_id, milestone_order) DO NOTHING;
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
