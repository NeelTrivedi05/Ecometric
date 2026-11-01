import pytest

from app.auth import AuthenticatedUser


@pytest.fixture(autouse=True)
def authenticate_api_requests(monkeypatch):
    """Keep legacy endpoint tests focused on route behavior, not JWT transport."""
    user = AuthenticatedUser(
        id="test-user",
        email="test@example.com",
        claims={"sub": "test-user", "email": "test@example.com"},
    )
    monkeypatch.setattr("app.auth.authenticate_token", lambda authorization: user)
