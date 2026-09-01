import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_leaderboard_unauthorized(client):
    res = client.get('/api/leaderboard')
    # Without token, should be 401
    assert res.status_code == 401

def test_leaderboard_options(client):
    res = client.options('/api/leaderboard')
    assert res.status_code == 200
