import pytest
from fastapi import status


def criar_jogo(client, titulo="Fallout 4", plataforma="PC", **atributos):
    return client.post(
        "/games/",
        json={
            "titulo": titulo,
            "plataforma": plataforma,
            **atributos,
        },
    )


# --------------------------------------------------
# POST
# --------------------------------------------------


def test_cadastro_jogo(client, dados_jogo):
    response = client.post("/games/", json=dados_jogo)

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json() == {
        **dados_jogo,
        "id": 1,
        "estado": "quero_jogar",
        "posicao": 1,
    }


def test_cadastro_jogo_duplicado(client):
    criar_jogo(client)

    response = criar_jogo(client)

    assert response.status_code == status.HTTP_409_CONFLICT


def test_cadastro_com_dados_invalidos(client):
    response = criar_jogo(client, titulo="")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_cadastro_finalizado_sem_contador(client):
    response = criar_jogo(client, estado="finalizado")

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["vezes_finalizado"] == 1


def test_cadastro_finalizado_com_contador_zero(client):
    response = criar_jogo(
        client,
        estado="finalizado",
        vezes_finalizado=0,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# --------------------------------------------------
# GET
# --------------------------------------------------


def test_consulta_jogo(client):
    jogo = criar_jogo(client).json()

    response = client.get(f"/games/{jogo['id']}")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == jogo


def test_consulta_jogo_inexistente(client):
    response = client.get("/games/999")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_listagem_vazia(client):
    response = client.get("/games/")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_listagem_jogos(client):
    primeiro = criar_jogo(client, "Fallout 4").json()
    segundo = criar_jogo(client, "Fallout 1").json()

    response = client.get("/games/")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [primeiro, segundo]


def test_listagem_filtrada_por_estado(client):
    criar_jogo(client, "Fallout 4", estado="quero_jogar")
    jogo = criar_jogo(client, "Fallout 1", estado="jogando").json()

    response = client.get("/games/", params={"estado": "jogando"})

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [jogo]


def test_listagem_com_estado_invalido(client):
    response = client.get("/games/", params={"estado": "abandonado"})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# --------------------------------------------------
# PUT
# --------------------------------------------------


def test_edicao_jogo(client, dados_atualizados):
    jogo = criar_jogo(client).json()

    response = client.put(
        f"/games/{jogo['id']}",
        json=dados_atualizados,
    )

    esperado = {**jogo, **dados_atualizados}

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == esperado
    assert client.get(f"/games/{jogo['id']}").json() == esperado


def test_edicao_jogo_inexistente(client, dados_atualizados):
    response = client.put("/games/999", json=dados_atualizados)

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_edicao_jogo_duplicado(client, dados_atualizados):
    criar_jogo(client, "Fallout 1")
    jogo = criar_jogo(client, "Fallout 4").json()

    response = client.put(
        f"/games/{jogo['id']}",
        json=dados_atualizados,
    )

    assert response.status_code == status.HTTP_409_CONFLICT


def test_edicao_com_dados_invalidos(client, dados_atualizados):
    jogo = criar_jogo(client).json()
    dados_atualizados["titulo"] = ""

    response = client.put(
        f"/games/{jogo['id']}",
        json=dados_atualizados,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_edicao_finalizado_com_contador_zero(client, dados_atualizados):
    jogo = criar_jogo(client, estado="finalizado").json()
    dados_atualizados["vezes_finalizado"] = 0

    response = client.put(
        f"/games/{jogo['id']}",
        json=dados_atualizados,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# --------------------------------------------------
# DELETE
# --------------------------------------------------


def test_exclusao_jogo(client):
    jogo = criar_jogo(client).json()

    response = client.delete(f"/games/{jogo['id']}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert response.content == b""
    assert client.get(f"/games/{jogo['id']}").status_code == (status.HTTP_404_NOT_FOUND)


def test_exclusao_jogo_inexistente(client):
    response = client.delete("/games/999")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_exclusao_reorganiza_posicoes(client):
    primeiro = criar_jogo(client, "Fallout 4").json()
    segundo = criar_jogo(client, "Fallout 1").json()

    client.delete(f"/games/{primeiro['id']}")

    response = client.get(f"/games/{segundo['id']}")

    assert response.json()["posicao"] == 1


# --------------------------------------------------
# PATCH - Position
# --------------------------------------------------


@pytest.mark.parametrize(
    "indice, direcao, ordem_esperada",
    [
        (1, "subir", ["Fallout 1", "Fallout 4"]),
        (0, "descer", ["Fallout 1", "Fallout 4"]),
    ],
)
def test_alteracao_posicao(client, indice, direcao, ordem_esperada):
    jogos = [
        criar_jogo(client, "Fallout 4").json(),
        criar_jogo(client, "Fallout 1").json(),
    ]

    jogo_id = jogos[indice]["id"]

    response = client.patch(
        f"/games/{jogo_id}/position",
        json={"direcao": direcao},
    )

    assert response.status_code == status.HTTP_200_OK

    resultado = client.get("/games/").json()

    assert [jogo["titulo"] for jogo in resultado] == ordem_esperada


def test_alteracao_posicao_jogo_inexistente(client):
    response = client.patch(
        "/games/999/position",
        json={"direcao": "subir"},
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.parametrize("direcao", ["subir", "descer"])
def test_alteracao_posicao_fora_dos_limites(client, direcao):
    jogo = criar_jogo(client).json()

    response = client.patch(
        f"/games/{jogo['id']}/position",
        json={"direcao": direcao},
    )

    assert response.status_code == status.HTTP_409_CONFLICT


def test_alteracao_posicao_direcao_invalida(client):
    jogo = criar_jogo(client).json()

    response = client.patch(
        f"/games/{jogo['id']}/position",
        json={"direcao": "esquerda"},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# --------------------------------------------------
# PATCH - Status
# --------------------------------------------------


def test_alteracao_estado(client):
    jogo = criar_jogo(client).json()

    response = client.patch(
        f"/games/{jogo['id']}/status",
        json={"estado": "jogando"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["estado"] == "jogando"
    assert client.get(f"/games/{jogo['id']}").json()["estado"] == "jogando"


def test_alteracao_estado_jogo_inexistente(client):
    response = client.patch(
        "/games/999/status",
        json={"estado": "jogando"},
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_alteracao_estado_invalido(client):
    jogo = criar_jogo(client).json()

    response = client.patch(
        f"/games/{jogo['id']}/status",
        json={"estado": "abandonado"},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_finalizacao_incrementa_contador(client):
    jogo = criar_jogo(
        client,
        estado="jogando",
        vezes_finalizado=2,
    ).json()

    response = client.patch(
        f"/games/{jogo['id']}/status",
        json={"estado": "finalizado"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["vezes_finalizado"] == 3


def test_alteracao_para_mesmo_estado_sem_efeito(client):
    jogo = criar_jogo(client, estado="finalizado").json()

    response = client.patch(
        f"/games/{jogo['id']}/status",
        json={"estado": "finalizado"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == jogo
