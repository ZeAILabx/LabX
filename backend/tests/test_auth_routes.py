import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['data']['status'] == 'healthy'

def test_login_missing_credentials(client):
    res = client.post('/api/auth/login', json={})
    assert res.status_code == 400
    data = res.get_json()
    assert data['success'] is False

def test_register_missing_credentials(client):
    res = client.post('/api/auth/register', json={})
    assert res.status_code == 400
    data = res.get_json()
    assert data['success'] is False

def test_me_unauthorized(client):
    res = client.get('/api/auth/me')
    assert res.status_code == 401
