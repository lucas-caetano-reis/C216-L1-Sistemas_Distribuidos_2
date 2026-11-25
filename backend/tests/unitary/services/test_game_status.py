import pytest

from app.schemas.game import (
    GameCreate,
    GameStatus,
    GameStatusUpdate,
)
from app.services.game import (
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
# Movimentação entre estados
# --------------------------------------------------


@pytest.mark.parametrize(
    "origem, destino",
    [
        (GameStatus.QUERO_JOGAR, GameStatus.JOGANDO),
        (GameStatus.QUERO_JOGAR, GameStatus.FINALIZADO),
        (GameStatus.JOGANDO, GameStatus.QUERO_JOGAR),
        (GameStatus.JOGANDO, GameStatus.FINALIZADO),
        (GameStatus.FINALIZADO, GameStatus.QUERO_JOGAR),
        (GameStatus.FINALIZADO, GameStatus.JOGANDO),
    ],
)
def test_movimentacao_entre_estados(servico, origem, destino):
    jogo = criar_jogo(servico, estado=origem)

    atualizado = servico.update_status(
        jogo.id,
        GameStatusUpdate(estado=destino),
    )

    assert atualizado.estado == destino


def test_movimentacao_jogo_inexistente(servico):
    with pytest.raises(GameNotFoundError):
        servico.update_status(
            999,
            GameStatusUpdate(estado=GameStatus.JOGANDO),
        )


@pytest.mark.parametrize("estado", list(GameStatus))
def test_movimentacao_para_mesmo_estado_sem_efeito(
    servico,
    estado,
):
    criar_jogo(servico, "Fallout 1", estado=estado)
    jogo = criar_jogo(servico, "GTA VI", estado=estado)

    atualizado = servico.update_status(
        jogo.id,
        GameStatusUpdate(estado=estado),
    )

    assert atualizado == jogo


def test_movimentacao_insere_no_final_do_destino(servico):
    criar_jogo(
        servico,
        "Fallout 1",
        estado=GameStatus.JOGANDO,
    )
    criar_jogo(
        servico,
        "Dark Souls",
        estado=GameStatus.JOGANDO,
    )

    jogo = criar_jogo(servico, "GTA VI")

    atualizado = servico.update_status(
        jogo.id,
        GameStatusUpdate(estado=GameStatus.JOGANDO),
    )

    assert atualizado.posicao == 3


def test_movimentacao_para_lista_vazia(servico):
    criar_jogo(servico, "Fallout 1")
    jogo = criar_jogo(servico, "GTA VI")

    atualizado = servico.update_status(
        jogo.id,
        GameStatusUpdate(estado=GameStatus.JOGANDO),
    )

    assert atualizado.posicao == 1


@pytest.mark.parametrize("indice", [0, 1, 2])
def test_movimentacao_reorganiza_lista_origem(servico, indice):
    jogos = [
        criar_jogo(servico, "GTA VI"),
        criar_jogo(servico, "Fallout 1"),
        criar_jogo(servico, "Dark Souls"),
    ]

    servico.update_status(
        jogos[indice].id,
        GameStatusUpdate(estado=GameStatus.JOGANDO),
    )

    restantes = servico.list(GameStatus.QUERO_JOGAR)

    assert [jogo.posicao for jogo in restantes] == [1, 2]


def test_movimentacao_preserva_ordem_da_lista_destino(servico):
    primeiro = criar_jogo(
        servico,
        "Fallout 1",
        estado=GameStatus.JOGANDO,
    )

    segundo = criar_jogo(
        servico,
        "Dark Souls",
        estado=GameStatus.JOGANDO,
    )

    jogo = criar_jogo(servico, "GTA VI")

    servico.update_status(
        jogo.id,
        GameStatusUpdate(estado=GameStatus.JOGANDO),
    )

    destino = servico.list(GameStatus.JOGANDO)

    assert [registro.id for registro in destino] == [
        primeiro.id,
        segundo.id,
        jogo.id,
    ]


def test_movimentacao_preserva_terceira_lista(servico):
    outro = criar_jogo(
        servico,
        "Fallout 1",
        estado=GameStatus.FINALIZADO,
    )

    jogo = criar_jogo(servico, "GTA VI")

    servico.update_status(
        jogo.id,
        GameStatusUpdate(estado=GameStatus.JOGANDO),
    )

    assert servico.get(outro.id) == outro
