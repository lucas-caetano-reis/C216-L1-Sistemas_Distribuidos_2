import pytest
from pydantic import ValidationError

from app.schemas.game import (
    GameCreate,
    GamePositionUpdate,
    GameRead,
    GameStatus,
    GameStatusUpdate,
    GameUpdate,
)


@pytest.fixture
def dados_jogo():
    return {
        "titulo": "GTA VI",
        "plataforma": "PC",
        "vezes_finalizado": 0,
        "anotacoes": "Jogar quando tiver um PC bom.",
    }


@pytest.fixture
def dados_atualizados():
    return {
        "titulo": "Fallout 1",
        "plataforma": "PC",
        "vezes_finalizado": 6,
        "anotacoes": "Finalizei o jogo seis vezes.",
    }


# --------------------------------------------------
# GameCreate
# --------------------------------------------------


def test_criacao_jogo_valido(dados_jogo):
    jogo = GameCreate(**dados_jogo)

    assert jogo.titulo == dados_jogo["titulo"]
    assert jogo.plataforma == dados_jogo["plataforma"]
    assert jogo.vezes_finalizado == dados_jogo["vezes_finalizado"]
    assert jogo.anotacoes == dados_jogo["anotacoes"]


def test_criacao_valores_padrao():
    jogo = GameCreate(titulo="GTA VI", plataforma="PC")

    assert jogo.vezes_finalizado == 0
    assert jogo.anotacoes is None
    assert jogo.estado == GameStatus.QUERO_JOGAR


@pytest.mark.parametrize("titulo", ["", "   ", "a" * 201])
def test_criacao_titulo_invalido(dados_jogo, titulo):
    dados_jogo["titulo"] = titulo

    with pytest.raises(ValidationError):
        GameCreate(**dados_jogo)


@pytest.mark.parametrize("plataforma", ["", "   ", "a" * 51])
def test_criacao_plataforma_invalida(dados_jogo, plataforma):
    dados_jogo["plataforma"] = plataforma

    with pytest.raises(ValidationError):
        GameCreate(**dados_jogo)


@pytest.mark.parametrize("quantidade", [-1, -10, -100])
def test_criacao_contador_negativo(dados_jogo, quantidade):
    dados_jogo["vezes_finalizado"] = quantidade

    with pytest.raises(ValidationError):
        GameCreate(**dados_jogo)


def test_criacao_anotacoes_muito_longas(dados_jogo):
    dados_jogo["anotacoes"] = "a" * 2001

    with pytest.raises(ValidationError):
        GameCreate(**dados_jogo)


@pytest.mark.parametrize("estado", list(GameStatus))
def test_criacao_estado_valido(dados_jogo, estado):
    dados_jogo["estado"] = estado
    dados_jogo["vezes_finalizado"] = 1

    jogo = GameCreate(**dados_jogo)

    assert jogo.estado == estado


@pytest.mark.parametrize("estado", ["abandonado", ""])
def test_criacao_estado_invalido(dados_jogo, estado):
    dados_jogo["estado"] = estado

    with pytest.raises(ValidationError):
        GameCreate(**dados_jogo)


def test_criacao_jogo_finalizado(dados_jogo):
    dados_jogo["estado"] = GameStatus.FINALIZADO
    dados_jogo["vezes_finalizado"] = 2

    jogo = GameCreate(**dados_jogo)

    assert jogo.estado == GameStatus.FINALIZADO
    assert jogo.vezes_finalizado == 2


def test_criacao_remove_espacos(dados_jogo):
    dados_jogo["titulo"] = "  GTA VI  "
    dados_jogo["plataforma"] = "  PC  "

    jogo = GameCreate(**dados_jogo)

    assert jogo.titulo == "GTA VI"
    assert jogo.plataforma == "PC"


@pytest.mark.parametrize("campo", ["titulo", "plataforma"])
def test_criacao_sem_campos_obrigatorios(dados_jogo, campo):
    dados_jogo.pop(campo)

    with pytest.raises(ValidationError):
        GameCreate(**dados_jogo)


@pytest.mark.parametrize(
    "campo, valor",
    [
        ("id", 1),
        ("posicao", 1),
    ],
)
def test_criacao_com_campos_nao_permitidos(dados_jogo, campo, valor):
    dados_jogo[campo] = valor

    with pytest.raises(ValidationError):
        GameCreate(**dados_jogo)


# --------------------------------------------------
# GameUpdate
# --------------------------------------------------


def test_atualizacao_jogo_valido(dados_atualizados):
    jogo = GameUpdate(**dados_atualizados)

    assert jogo.titulo == dados_atualizados["titulo"]
    assert jogo.plataforma == dados_atualizados["plataforma"]
    assert jogo.vezes_finalizado == dados_atualizados["vezes_finalizado"]
    assert jogo.anotacoes == dados_atualizados["anotacoes"]


@pytest.mark.parametrize(
    "campo, valor",
    [
        ("titulo", ""),
        ("titulo", "   "),
        ("titulo", "a" * 201),
        ("plataforma", ""),
        ("plataforma", "   "),
        ("plataforma", "a" * 51),
        ("vezes_finalizado", -1),
        ("anotacoes", "a" * 2001),
    ],
)
def test_atualizacao_com_campos_invalidos(dados_atualizados, campo, valor):
    dados_atualizados[campo] = valor

    with pytest.raises(ValidationError):
        GameUpdate(**dados_atualizados)


@pytest.mark.parametrize(
    "campo",
    ["titulo", "plataforma", "vezes_finalizado"],
)
def test_atualizacao_sem_campos_obrigatorios(dados_atualizados, campo):
    dados_atualizados.pop(campo)

    with pytest.raises(ValidationError):
        GameUpdate(**dados_atualizados)


@pytest.mark.parametrize(
    "campo, valor",
    [
        ("id", 1),
        ("estado", GameStatus.JOGANDO),
        ("posicao", 2),
    ],
)
def test_atualizacao_com_campos_nao_permitidos(dados_atualizados, campo, valor):
    dados_atualizados[campo] = valor

    with pytest.raises(ValidationError):
        GameUpdate(**dados_atualizados)


def test_atualizacao_anotacoes_nulas(dados_atualizados):
    dados_atualizados["anotacoes"] = None

    jogo = GameUpdate(**dados_atualizados)

    assert jogo.anotacoes is None


# --------------------------------------------------
# GamePositionUpdate
# --------------------------------------------------


@pytest.mark.parametrize("direcao", ["subir", "descer"])
def test_atualizacao_posicao_direcao_valida(direcao):
    movimentacao = GamePositionUpdate(direcao=direcao)

    assert movimentacao.direcao == direcao


@pytest.mark.parametrize("direcao", ["esquerda", "direita", ""])
def test_atualizacao_posicao_direcao_invalida(direcao):
    with pytest.raises(ValidationError):
        GamePositionUpdate(direcao=direcao)


# --------------------------------------------------
# GameStatusUpdate
# --------------------------------------------------


@pytest.mark.parametrize("estado", list(GameStatus))
def test_atualizacao_estado_valido(estado):
    movimentacao = GameStatusUpdate(estado=estado)

    assert movimentacao.estado == estado


@pytest.mark.parametrize("estado", ["abandonado", ""])
def test_atualizacao_estado_invalido(estado):
    with pytest.raises(ValidationError):
        GameStatusUpdate(estado=estado)


# --------------------------------------------------
# GameRead
# --------------------------------------------------


def test_leitura_jogo_criado(dados_jogo):
    jogo = GameRead(
        id=1,
        **dados_jogo,
        estado=GameStatus.QUERO_JOGAR,
        posicao=1,
    )

    assert jogo.id == 1
    assert jogo.titulo == dados_jogo["titulo"]
    assert jogo.plataforma == dados_jogo["plataforma"]
    assert jogo.vezes_finalizado == dados_jogo["vezes_finalizado"]
    assert jogo.anotacoes == dados_jogo["anotacoes"]
    assert jogo.estado == GameStatus.QUERO_JOGAR
    assert jogo.posicao == 1


def test_leitura_jogo_atualizado(dados_atualizados):
    jogo = GameRead(
        id=1,
        **dados_atualizados,
        estado=GameStatus.FINALIZADO,
        posicao=1,
    )

    assert jogo.id == 1
    assert jogo.titulo == dados_atualizados["titulo"]
    assert jogo.plataforma == dados_atualizados["plataforma"]
    assert jogo.vezes_finalizado == dados_atualizados["vezes_finalizado"]
    assert jogo.anotacoes == dados_atualizados["anotacoes"]
    assert jogo.estado == GameStatus.FINALIZADO
    assert jogo.posicao == 1
