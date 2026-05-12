import os
import pytest
from app.main import app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_index_endpoint(client):
    """Test the main endpoint returns correct structure."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert "service" in data
    assert "version" in data
    assert "hostname" in data
    assert data["service"] == "devops-app"


def test_health_endpoint(client):
    """Test the health endpoint returns OK status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"


def test_greeting_endpoint_without_feature_flag(client):
    """Test greeting endpoint returns v1 message when feature flag is off."""
    # Ensure feature flag is not set
    old_value = os.environ.pop("FEATURE_NEW_GREETING", None)

    response = client.get("/greeting")
    assert response.status_code == 200
    data = response.get_json()
    assert data["feature_enabled"] is False
    assert "Hello from DevOps App" in data["message"]
    assert data["version"] == "1.0"

    # Restore feature flag if it was set
    if old_value:
        os.environ["FEATURE_NEW_GREETING"] = old_value


def test_greeting_endpoint_with_feature_flag(client):
    """Test greeting endpoint returns v2 message when feature flag is on."""
    # Set feature flag
    os.environ["FEATURE_NEW_GREETING"] = "true"

    response = client.get("/greeting")
    assert response.status_code == 200
    data = response.get_json()
    assert data["feature_enabled"] is True
    assert "DevOps platform" in data["message"]
    assert data["version"] == "2.0"

    # Clean up
    del os.environ["FEATURE_NEW_GREETING"]
