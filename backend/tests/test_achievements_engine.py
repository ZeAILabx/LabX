import pytest
from app.services.achievements_engine import (
    award_achievement,
    check_and_award_quest_achievements,
    check_and_award_points_achievements,
    sync_all_user_achievements
)

TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

def test_award_achievement_non_existent_key():
    # Attempting to award an invalid key should return None gracefully without raising
    res = award_achievement(TEST_USER_ID, 'invalid_key_xyz_123')
    assert res is None

def test_check_and_award_points():
    # Verify points threshold evaluator does not crash
    check_and_award_points_achievements(TEST_USER_ID, total_points=50)
    check_and_award_points_achievements(TEST_USER_ID, total_points=250)
    check_and_award_points_achievements(TEST_USER_ID, total_points=1200)

def test_sync_all_user_achievements_safe():
    # Verify sync function runs safely without crashing
    sync_all_user_achievements(TEST_USER_ID)
