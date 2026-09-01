-- ============================================================
-- 018_seed_domains_stages.sql — 12 Domains, 5 Stages, 25 Levels & 12 Domain Guilds
-- ============================================================

-- Seed 12 Domains
INSERT INTO domains (name, description, display_order, icon) VALUES
    ('Artificial Intelligence & Machine Learning', 'AI models, machine learning systems, NLP, computer vision, and neural networks', 1, 'Brain'),
    ('Healthcare & MedTech', 'Digital health, medical devices, biotechnology, telemedicine, and healthcare management', 2, 'HeartPulse'),
    ('Smart Education', 'EdTech platforms, interactive learning, adaptive testing, and educational tools', 3, 'GraduationCap'),
    ('Women Safety & Social Impact', 'Safety devices, emergency response, non-profit technology, and social impact platforms', 4, 'ShieldAlert'),
    ('Cybersecurity', 'Network security, data protection, threat intelligence, and identity management', 5, 'Lock'),
    ('FinTech & Digital Economy', 'Payments, banking infrastructure, DeFi, financial management, and Web3 solutions', 6, 'Coins'),
    ('Smart Mobility & Logistics', 'Electric vehicles, autonomous tech, supply chain optimization, and smart fleet management', 7, 'Truck'),
    ('Sustainability', 'CleanTech, renewable energy, waste management, carbon tracking, and green tech', 8, 'Leaf'),
    ('Agriculture & Food Technology', 'AgriTech, precision farming, food supply chain, and sustainable agriculture', 9, 'Sprout'),
    ('Smart Cities & Infrastructure', 'IoT infrastructure, smart grids, urban planning technology, and civic tech', 10, 'Building2'),
    ('Media, Entertainment & Creator Technology', 'Creator economy tools, streaming platforms, digital media, and gaming tech', 11, 'Video'),
    ('Space, Robotics & Advanced Technology', 'Aerospace, industrial robotics, quantum computing, and hardware engineering', 12, 'Rocket')
ON CONFLICT (name) DO NOTHING;

-- Seed 5 Stages
INSERT INTO stages (name, description, stage_order) VALUES
    ('Discover', 'Identify problem, explore opportunities, and conduct initial research', 1),
    ('Validate', 'Talk to potential users, validate problem-solution fit, and run experiments', 2),
    ('Build', 'Develop wireframes, prototypes, and a functional Minimum Viable Product (MVP)', 3),
    ('Launch', 'Deploy product to production, acquire early adopters, and launch publicly', 4),
    ('Grow', 'Scale marketing, generate recurring revenue, optimize operations, and expand', 5)
ON CONFLICT (name) DO NOTHING;

-- Seed 5 Levels for EACH Stage (total 25 levels)
DO $$
DECLARE
    stage_rec RECORD;
    i INTEGER;
BEGIN
    FOR stage_rec IN SELECT id, stage_order, name FROM stages LOOP
        FOR i IN 1..5 LOOP
            INSERT INTO levels (stage_id, name, level_order, description)
            VALUES (
                stage_rec.id,
                'Level ' || i,
                i,
                stage_rec.name || ' Stage - Level ' || i || ' progression milestones'
            )
            ON CONFLICT (stage_id, level_order) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Create 12 Guilds (1 per domain)
INSERT INTO guilds (name, description, domain_id)
SELECT 
    d.name || ' Guild',
    'Exclusive private community for founders building in ' || d.name,
    d.id
FROM domains d
ON CONFLICT (name) DO NOTHING;
