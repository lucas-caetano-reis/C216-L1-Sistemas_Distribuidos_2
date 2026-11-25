import pytest

from app.schemas.game import (
    GameCreate,
    GamePositionUpdate,
    GameStatus,
    GameStatusUpdate,
    GameUpdate,
)
from app.services.game import (
    GameInvalidCompletionCountError,
)


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
# Contador de finalizações
# --------------------------------------------------


@pytest.mark.parametrize(
    "estado",
    [GameStatus.QUERO_JOGAR, GameStatus.JOGANDO],
)
def test_cadastro_contador_padrao_zero(servico, estado):
    jogo = criar_jogo(servico, estado=estado)

    assert jogo.vezes_finalizado == 0


def test_cadastro_finalizado_sem_contador(servico):
    jogo = criar_jogo(
        servico,
        estado=GameStatus.FINALIZADO,
    )

    assert jogo.vezes_finalizado == 1


def test_cadastro_finalizado_com_contador_zero(servico):
    with pytest.raises(GameInvalidCompletionCountError):
        criar_jogo(
            servico,
            estado=GameStatus.FINALIZADO,
            vezes_finalizado=0,
        )


@pytest.mark.parametrize("estado", list(GameStatus))
def test_cadastro_preserva_contador_informado(servico, estado):
    jogo = criar_jogo(
        servico,
        estado=estado,
        vezes_finalizado=3,
    )

    assert jogo.vezes_finalizado == 3


@pytest.mark.parametrize(
    "estado",
    [GameStatus.QUERO_JOGAR, GameStatus.JOGANDO],
)
def test_entrada_em_finalizado_incrementa_contador(servico, estado):
    jogo = criar_jogo(
        servico,
        estado=estado,
        vezes_finalizado=2,
    )

    atualizado = servico.update_status(
        jogo.id,
        GameStatusUpdate(estado=GameStatus.FINALIZADO),
    )

    assert atualizado.vezes_finalizado == 3


@pytest.mark.parametrize(
    "estado",
    [GameStatus.QUERO_JOGAR, GameStatus.JOGANDO],
)
def test_saida_de_finalizado_preserva_contador(servico, estado):
    jogo = criar_jogo(
        servico,
        estado=GameStatus.FINALIZADO,
        vezes_finalizado=2,
    )

    atualizado = servico.update_status(
        jogo.id,
        GameStatusUpdate(estado=estado),
    )

    assert atualizado.vezes_finalizado == 2


@pytest.mark.parametrize(
    "origem, destino",
    [
        (GameStatus.QUERO_JOGAR, GameStatus.JOGANDO),
        (GameStatus.JOGANDO, GameStatus.QUERO_JOGAR),
    ],
)
def test_movimentacao_sem_finalizacao_preserva_contador(
    servico,
    origem,
    destino,
):
    jogo = criar_jogo(
        servico,
        estado=origem,
        vezes_finalizado=2,
    )

    atualizado = servico.update_status(
        jogo.id,
        GameStatusUpdate(estado=destino),
    )

    assert atualizado.vezes_finalizado == 2


def test_nova_finalizacao_incrementa_contador_novamente(servico):
    jogo = criar_jogo(
        servico,
        estado=GameStatus.FINALIZADO,
        vezes_finalizado=2,
    )

    servico.update_status(
        jogo.id,
        GameStatusUpdate(estado=GameStatus.JOGANDO),
    )

    atualizado = servico.update_status(
        jogo.id,
        GameStatusUpdate(estado=GameStatus.FINALIZADO),
    )

    assert atualizado.vezes_finalizado == 3


@pytest.mark.parametrize(
    "estado, quantidade",
    [
        (GameStatus.QUERO_JOGAR, 0),
        (GameStatus.JOGANDO, 0),
        (GameStatus.FINALIZADO, 1),
        (GameStatus.FINALIZADO, 5),
    ],
)
def test_edicao_manual_do_contador(
    servico,
    estado,
    quantidade,
):
    jogo = criar_jogo(
        servico,
        estado=estado,
        vezes_finalizado=3,
    )

    atualizado = servico.update(
        jogo.id,
        GameUpdate(
            titulo=jogo.titulo,
            plataforma=jogo.plataforma,
            vezes_finalizado=quantidade,
            anotacoes=jogo.anotacoes,
        ),
    )

    assert atualizado.vezes_finalizado == quantidade


def test_edicao_finalizado_com_contador_zero(servico):
    jogo = criar_jogo(
        servico,
        estado=GameStatus.FINALIZADO,
    )

    with pytest.raises(GameInvalidCompletionCountError):
        servico.update(
            jogo.id,
            GameUpdate(
                titulo=jogo.titulo,
                plataforma=jogo.plataforma,
                vezes_finalizado=0,
            ),
        )


def test_edicao_demais_atributos_preserva_contador(servico):
    jogo = criar_jogo(
        servico,
        estado=GameStatus.FINALIZADO,
        vezes_finalizado=3,
    )

    atualizado = servico.update(
        jogo.id,
        GameUpdate(
            titulo=jogo.titulo,
            plataforma=jogo.plataforma,
            vezes_finalizado=jogo.vezes_finalizado,
            anotacoes="Excelente jogo.",
        ),
    )

    assert atualizado.vezes_finalizado == 3


def test_ordenacao_preserva_contador(servico):
    criar_jogo(
        servico,
        "Fallout 1",
        estado=GameStatus.FINALIZADO,
    )

    jogo = criar_jogo(
        servico,
        "Dark Souls",
        estado=GameStatus.FINALIZADO,
        vezes_finalizado=3,
    )

    atualizado = servico.update_position(
        jogo.id,
        GamePositionUpdate(direcao="subir"),
    )

    assert atualizado.vezes_finalizado == 3


def test_cadastro_rejeita_contador_negativo(servico):
    dados = GameCreate.model_construct(
        titulo="Fallout 1",
        plataforma="PC",
        vezes_finalizado=-1,
    )

    with pytest.raises(GameInvalidCompletionCountError):
        servico.create(dados)


def test_edicao_rejeita_contador_negativo(servico):
    jogo = criar_jogo(servico)

    dados = GameUpdate.model_construct(
        titulo=jogo.titulo,
        plataforma=jogo.plataforma,
        vezes_finalizado=-1,
    )

    with pytest.raises(GameInvalidCompletionCountError):
        servico.update(jogo.id, dados)
