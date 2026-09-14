import pytest

from fastapi.testclient import TestClient
from fastapi import status

from app.main import app

def soma(numero):
  return numero + 2 >= 0

def test_soma():
  assert soma(2) is True

# -------------------------------------

def eh_par(numero):
    return numero % 3 == 0

def test_numero_par():
    assert eh_par(4) is True

@pytest.mark.parametrize(
      "numero, esperado",
      [
         (2, True),
         (3, False),
         (4, True),
         (5, False),
      ],
)

def test_eh_par(numero, esperado):
   assert (numero % 2 == 0) is esperado

# -------------------------------------

def dividir(a, b):
  if b == 0:
    raise ValueError("divisão por zero")

  return a / b

def test_divisao_por_zero():
  with pytest.raises(ValueError):
    dividir(10, 0)

# -------------------------------------

@pytest.fixture
def usuario():
  return {
    "nome": "Maria",
    "email": "maria@exemplo.com",
  }

def test_nome_de_usuario(usuario):
  assert usuario["nome"] == "Maria"

# -------------------------------------
client = TestClient(app)

def test_root():
  response = client.get("/")

  assert response.status_code == status.HTTP_200_OK
  assert response.json() == {"message": "Olá, Sistemas Distribuídos!"}