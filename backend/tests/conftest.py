import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.game import GameService


@pytest.fixture
def servico():
    return GameService()


@pytest.fixture
def dados_jogo():
    return {
        "titulo": "Fallout 4",
        "plataforma": "PC",
        "vezes_finalizado": 0,
        "anotacoes": "Jogar depois de terminar o New Vegas",
    }


@pytest.fixture
def dados_atualizados():
    return {
        "titulo": "Fallout 1",
        "plataforma": "PC",
        "vezes_finalizado": 6,
        "anotacoes": "Otimizar build unarmed",
    }


@pytest.fixture
def client(monkeypatch, servico):
    monkeypatch.setattr("app.api.routes.games.service", servico)

    with TestClient(app) as client:
        yield client
