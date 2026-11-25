import pytest

from app.schemas.game import (
    GameCreate,
    GamePositionUpdate,
    GameStatus,
)
from app.services.game import (
    GameInvalidPositionError,
    GameNotFoundError,
    GameService,
)


@pytest.fixture
def servico():
    return GameService()


def criar_jogo(
    servico,
    titulo="GTA VI",
    plataforma="PC",
    estado=GameStatus.QUERO_JOGAR,
    **atributos,
):
    return servico.create(
        GameCreate(
            titulo=titulo,
            plataforma=plataforma,
            estado=estado,
            **atributos,
        )
    )


# --------------------------------------------------
# Ordenação
# --------------------------------------------------


def test_subir_jogo(servico):
    criar_jogo(servico, "GTA VI")
    segundo = criar_jogo(servico, "Fallout 1")

    atualizado = servico.update_position(
        segundo.id,
        GamePositionUpdate(direcao="subir"),
    )

    assert atualizado.posicao == 1


def test_descer_jogo(servico):
    primeiro = criar_jogo(servico, "GTA VI")
    criar_jogo(servico, "Fallout 1")

    atualizado = servico.update_position(
        primeiro.id,
        GamePositionUpdate(direcao="descer"),
    )

    assert atualizado.posicao == 2


@pytest.mark.parametrize(
    "indice, direcao, ordem_esperada",
    [
        (1, "subir", [1, 0, 2]),
        (1, "descer", [0, 2, 1]),
    ],
)
def test_ordenacao_troca_jogos_adjacentes(
    servico,
    indice,
    direcao,
    ordem_esperada,
):
    jogos = [
        criar_jogo(servico, "GTA VI"),
        criar_jogo(servico, "Fallout 1"),
        criar_jogo(servico, "Dark Souls"),
    ]

    servico.update_position(
        jogos[indice].id,
        GamePositionUpdate(direcao=direcao),
    )

    resultado = servico.list(GameStatus.QUERO_JOGAR)

    assert [jogo.id for jogo in resultado] == [
        jogos[indice].id for indice in ordem_esperada
    ]


def test_primeiro_jogo_nao_pode_subir(servico):
    primeiro = criar_jogo(servico, "GTA VI")
    criar_jogo(servico, "Fallout 1")

    with pytest.raises(GameInvalidPositionError):
        servico.update_position(
            primeiro.id,
            GamePositionUpdate(direcao="subir"),
        )


def test_ultimo_jogo_nao_pode_descer(servico):
    criar_jogo(servico, "GTA VI")
    segundo = criar_jogo(servico, "Fallout 1")

    with pytest.raises(GameInvalidPositionError):
        servico.update_position(
            segundo.id,
            GamePositionUpdate(direcao="descer"),
        )


@pytest.mark.parametrize("direcao", ["subir", "descer"])
def test_jogo_unico_nao_pode_mudar_posicao(servico, direcao):
    jogo = criar_jogo(servico)

    with pytest.raises(GameInvalidPositionError):
        servico.update_position(
            jogo.id,
            GamePositionUpdate(direcao=direcao),
        )


def test_ordenacao_jogo_inexistente(servico):
    with pytest.raises(GameNotFoundError):
        servico.update_position(
            999,
            GamePositionUpdate(direcao="subir"),
        )


def test_ordenacao_mantem_posicoes_consecutivas(servico):
    criar_jogo(servico, "GTA VI")
    segundo = criar_jogo(servico, "Fallout 1")
    criar_jogo(servico, "Dark Souls")

    servico.update_position(
        segundo.id,
        GamePositionUpdate(direcao="subir"),
    )

    jogos = servico.list(GameStatus.QUERO_JOGAR)

    assert [jogo.posicao for jogo in jogos] == [1, 2, 3]


def test_ordenacao_preserva_estado(servico):
    criar_jogo(servico, "GTA VI")
    segundo = criar_jogo(servico, "Fallout 1")

    atualizado = servico.update_position(
        segundo.id,
        GamePositionUpdate(direcao="subir"),
    )

    assert atualizado.estado == GameStatus.QUERO_JOGAR


def test_ordenacao_preserva_outras_listas(servico):
    criar_jogo(servico, "GTA VI")
    segundo = criar_jogo(servico, "Fallout 1")

    outro = criar_jogo(
        servico,
        "Dark Souls",
        estado=GameStatus.JOGANDO,
    )

    servico.update_position(
        segundo.id,
        GamePositionUpdate(direcao="subir"),
    )

    assert servico.get(outro.id) == outro
