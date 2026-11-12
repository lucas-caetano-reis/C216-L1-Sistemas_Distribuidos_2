from fastapi import status
from fastapi.testclient import TestClient

from app.core.config import CORS_ORIGINS
from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")

    assert response.status_code == status.HTTP_200_OK


def test_cors_allowed_origin(client):
    origin = CORS_ORIGINS[0]

    response = client.options(
        "/items/",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["access-control-allow-origin"] == origin
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "content-type" in response.headers["access-control-allow-headers"].lower()


def test_cors_unknown_origin(client):
    response = client.options(
        "/items/",
        headers={
            "Origin": "https://origem-desconhecida.invalid",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "access-control-allow-origin" not in response.headers
