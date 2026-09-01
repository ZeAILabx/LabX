"""
Assessment Engine — Deterministic rules for Domain, Stage, Level calculation.
NO AI/LLM. Pure rule-based logic.
"""


# ── Domain Mapping ──────────────────────────────────────────────────
# Q1 directly determines domain. The option index maps to domain name.
DOMAIN_OPTIONS = [
    "Artificial Intelligence & Machine Learning",
    "Healthcare & MedTech",
    "Smart Education",
    "Women Safety & Social Impact",
    "Cybersecurity",
    "FinTech & Digital Economy",
    "Smart Mobility & Logistics",
    "Sustainability",
    "Agriculture & Food Technology",
    "Smart Cities & Infrastructure",
    "Media, Entertainment & Creator Technology",
    "Space, Robotics & Advanced Technology",
]


# ── Stage Mapping ───────────────────────────────────────────────────
# Q2 (project state) → Stage
Q2_STAGE_MAP = {
    1: "Discover",   # Only identified a problem
    2: "Discover",   # Have an idea/concept
    3: "Discover",   # Researched problem and users
    4: "Validate",   # Validated with real users
    5: "Build",      # Built prototype/MVP
    6: "Launch",     # Launched product
    7: "Launch",     # Active users
    8: "Grow",       # Paying customers/revenue
    9: "Grow",       # Actively scaling
}

# Q3 evidence options and their stage signals for cross-check
Q3_EVIDENCE_STAGE = {
    "problem_statement":      "Discover",
    "user_interviews":        "Validate",
    "market_research":        "Discover",
    "customer_validation":    "Validate",
    "prototype":              "Build",
    "working_mvp":            "Build",
    "live_product":           "Launch",
    "active_users":           "Launch",
    "paying_customers":       "Grow",
    "revenue":                "Grow",
    "none_yet":               "Discover",
}

STAGE_ORDER = ["Discover", "Validate", "Build", "Launch", "Grow"]


# ── Level Score Mappings ────────────────────────────────────────────
# Q4 — Execution (direct 1-5 score)
# Selected value IS the score

# Q5 — Validation/Traction
Q5_SCORE_MAP = {
    1: 1,  # None yet
    2: 2,  # Talked to potential users
    3: 3,  # Users tested solution
    4: 4,  # Regular active users
    5: 5,  # Paying customers
    6: 5,  # Consistent revenue/growth
}

# Q6 — Product Maturity
Q6_SCORE_MAP = {
    1: 1,  # No product yet
    2: 1,  # Concept/wireframe
    3: 2,  # Prototype/demo
    4: 3,  # Partially working
    5: 4,  # Working MVP
    6: 5,  # Production-ready
    7: 5,  # Continuously improved
}

# Q7 — Completed Work
Q7_SCORE_MAP = {
    1: 1,  # Only identified problem
    2: 2,  # Researched
    3: 3,  # Validated
    4: 3,  # Built prototype
    5: 4,  # Built MVP
    6: 4,  # Launched
    7: 5,  # Active users
    8: 5,  # Paying customers/revenue
    9: 5,  # Scaling
}

# Stage ceiling for starting level
STAGE_CEILING = {
    "Discover": 3,
    "Validate": 3,
    "Build": 4,
    "Launch": 5,
    "Grow": 5,
}


def determine_domain(q1_selection: int) -> str:
    """Q1 directly determines Domain. q1_selection is 1-indexed."""
    if q1_selection < 1 or q1_selection > len(DOMAIN_OPTIONS):
        raise ValueError(f"Invalid domain selection: {q1_selection}")
    return DOMAIN_OPTIONS[q1_selection - 1]


def determine_stage(q2_selection: int, q3_selections: list) -> str:
    """
    Determine stage using Q2 as primary signal, Q3 as cross-check.
    Q2 is 1-indexed (1-9).
    Q3 is a list of string keys from Q3_EVIDENCE_STAGE.
    """
    if q2_selection not in Q2_STAGE_MAP:
        raise ValueError(f"Invalid Q2 selection: {q2_selection}")

    primary_stage = Q2_STAGE_MAP[q2_selection]

    # Cross-check with Q3 evidence — find the highest stage from evidence
    if q3_selections:
        evidence_stages = [
            Q3_EVIDENCE_STAGE.get(ev, "Discover")
            for ev in q3_selections
            if ev in Q3_EVIDENCE_STAGE
        ]
        if evidence_stages:
            max_evidence_idx = max(STAGE_ORDER.index(s) for s in evidence_stages)
            primary_idx = STAGE_ORDER.index(primary_stage)
            # If evidence suggests a lower stage, use the lower one (conservative)
            # If evidence confirms or is higher, keep primary
            if max_evidence_idx < primary_idx:
                # Evidence doesn't support the claimed stage — use evidence
                return STAGE_ORDER[max_evidence_idx]

    return primary_stage


def calculate_level_score(q4: int, q5: int, q6: int, q7: int) -> float:
    """Calculate raw level score from Q4-Q7."""
    q4_score = q4  # Direct 1-5
    q5_score = Q5_SCORE_MAP.get(q5, 1)
    q6_score = Q6_SCORE_MAP.get(q6, 1)
    q7_score = Q7_SCORE_MAP.get(q7, 1)

    return (q4_score + q5_score + q6_score + q7_score) / 4.0


def score_to_level(score: float) -> int:
    """Convert average score to level (1-5)."""
    if score < 1.50:
        return 1
    elif score < 2.50:
        return 2
    elif score < 3.50:
        return 3
    elif score < 4.50:
        return 4
    else:
        return 5


def determine_starting_level(q4: int, q5: int, q6: int, q7: int, stage: str) -> int:
    """
    Calculate starting level with stage ceiling applied.
    Returns final level 1-5.
    """
    raw_score = calculate_level_score(q4, q5, q6, q7)
    calculated_level = score_to_level(raw_score)
    ceiling = STAGE_CEILING.get(stage, 5)
    return min(calculated_level, ceiling)


def process_assessment(answers: dict) -> dict:
    """
    Process complete assessment and return results.
    
    answers = {
        'q1': int (1-12),           # Domain selection
        'q2': int (1-9),            # Project state
        'q3': list[str],            # Evidence keys
        'q4': int (1-5),            # Execution
        'q5': int (1-6),            # Validation/Traction
        'q6': int (1-7),            # Product Maturity
        'q7': int (1-9),            # Completed Work
    }
    
    Returns: {
        'domain': str,
        'stage': str,
        'level': int,
        'level_score': float,
    }
    """
    domain = determine_domain(answers['q1'])
    stage = determine_stage(answers['q2'], answers.get('q3', []))
    level_score = calculate_level_score(
        answers['q4'], answers['q5'], answers['q6'], answers['q7']
    )
    level = determine_starting_level(
        answers['q4'], answers['q5'], answers['q6'], answers['q7'], stage
    )

    return {
        'domain': domain,
        'stage': stage,
        'level': level,
        'level_score': round(level_score, 2),
    }
