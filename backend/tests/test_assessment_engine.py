import pytest
from app.services.assessment_engine import (
    determine_domain,
    determine_stage,
    calculate_level_score,
    score_to_level,
    determine_starting_level,
    process_assessment,
    DOMAIN_OPTIONS,
)

def test_determine_domain():
    assert determine_domain(1) == "Artificial Intelligence & Machine Learning"
    assert determine_domain(2) == "Healthcare & MedTech"
    assert determine_domain(12) == "Space, Robotics & Advanced Technology"

    with pytest.raises(ValueError):
        determine_domain(13)

def test_determine_stage():
    assert determine_stage(1, []) == "Discover"
    assert determine_stage(4, ["customer_validation"]) == "Validate"
    assert determine_stage(5, ["working_mvp"]) == "Build"
    assert determine_stage(6, ["live_product"]) == "Launch"
    assert determine_stage(8, ["revenue"]) == "Grow"

def test_calculate_level_score():
    # q4=1, q5=1, q6=1, q7=1 -> (1+1+1+1)/4 = 1.0
    score = calculate_level_score(1, 1, 1, 1)
    assert score == 1.0

    # q4=5, q5=5, q6=6, q7=7 -> (5+5+5+5)/4 = 5.0
    score = calculate_level_score(5, 5, 6, 7)
    assert score == 5.0

def test_score_to_level():
    assert score_to_level(1.0) == 1
    assert score_to_level(1.49) == 1
    assert score_to_level(1.50) == 2
    assert score_to_level(2.49) == 2
    assert score_to_level(2.50) == 3
    assert score_to_level(3.50) == 4
    assert score_to_level(4.50) == 5

def test_determine_starting_level_ceiling():
    # Calculated level 5, but Discover stage ceiling is level 3
    level = determine_starting_level(5, 5, 5, 5, "Discover")
    assert level == 3

    # Calculated level 5 in Launch stage -> Level 5 allowed
    level = determine_starting_level(5, 5, 5, 5, "Launch")
    assert level == 5

def test_process_assessment():
    answers = {
        'q1': 2, # Healthcare
        'q2': 1, # Problem identified -> Discover
        'q3': ['problem_statement'],
        'q4': 1,
        'q5': 1,
        'q6': 1,
        'q7': 1,
    }
    result = process_assessment(answers)
    assert result['domain'] == "Healthcare & MedTech"
    assert result['stage'] == "Discover"
    assert result['level'] == 1
