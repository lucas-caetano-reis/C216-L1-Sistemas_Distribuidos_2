from fastapi import status
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "A API está funcionando!"}


# -------------------------------------


def test_list_users():
    response = client.get("/users/")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"limit": 10}


# -------------------------------------


def test_list_users_with_limit():
    response = client.get("/users/", params={"limit": 5})

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"limit": 5}


# -------------------------------------


def test_create_user():
    response = client.post("/users/", json={"nome": "Ana", "email": "ana@email.com"})

    assert response.status_code == status.HTTP_200_OK

    assert response.json() == {"nome": "Ana", "email": "ana@email.com"}


# -------------------------------------


def test_get_user():
    response = client.get("/users/1")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"user_id": 1}


# -------------------------------------


def test_delete_user():
    response = client.delete("/users/1")

    assert response.status_code == status.HTTP_200_OK

    assert response.json() == {"user_id": 1, "message": "Usuário removido com sucesso"}


# -------------------------------------


def test_update_user():
    response = client.put(
        "/users/1", json={"nome": "Ana Silva", "email": "ana.silva@email.com"}
    )

    assert response.status_code == status.HTTP_200_OK

    assert response.json() == {
        "user_id": 1,
        "nome": "Ana Silva",
        "email": "ana.silva@email.com",
    }


# -------------------------------------


def test_patch_user():
    response = client.patch("/users/1", json={"nome": "Ana Souza"})

    assert response.status_code == status.HTTP_200_OK

    assert response.json() == {"user_id": 1, "nome": "Ana Souza", "email": None}
