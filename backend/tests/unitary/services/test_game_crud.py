import pytest

from app.schemas.game import (
    GameCreate,
    GamePositionUpdate,
    GameStatus,
    GameUpdate,
)
from app.services.game import (
    GameAlreadyExistsError,
    GameNotFoundError,
    GameService,
)


@pytest.fixture
def servico():
    return GameService()


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
# Cadastro
# --------------------------------------------------


def test_cadastro_jogo_valido(servico, dados_jogo):
    jogo = servico.create(GameCreate(**dados_jogo))

    assert jogo.titulo == dados_jogo["titulo"]
    assert jogo.plataforma == dados_jogo["plataforma"]
    assert jogo.vezes_finalizado == dados_jogo["vezes_finalizado"]
    assert jogo.anotacoes == dados_jogo["anotacoes"]


@pytest.mark.parametrize("estado", list(GameStatus))
def test_cadastro_em_qualquer_estado_e_na_primeira_posicao(servico, estado):
    jogo = criar_jogo(servico, estado=estado)

    assert jogo.estado == estado
    assert jogo.posicao == 1


def test_cadastro_gera_identificadores_unicos(servico):
    primeiro = criar_jogo(servico, "GTA VI")
    segundo = criar_jogo(servico, "Fallout 1")

    assert primeiro.id != segundo.id


def test_cadastro_na_ultima_posicao(servico):
    criar_jogo(servico, "GTA VI")
    criar_jogo(servico, "Fallout 1")

    jogo = criar_jogo(servico, "Dark Souls")

    assert jogo.posicao == 3


def test_cadastro_posicoes_independentes(servico):
    criar_jogo(servico, "GTA VI")
    criar_jogo(servico, "Fallout 1")

    jogo = criar_jogo(
        servico,
        "Dark Souls",
        estado=GameStatus.JOGANDO,
    )

    assert jogo.posicao == 1


def test_cadastro_mesmo_titulo_plataformas_diferentes(servico):
    criar_jogo(servico, "Fallout 1", "PC")

    criar_jogo(servico, "Fallout 1", "Xbox")

    assert len(servico.list()) == 2


def test_cadastro_jogo_duplicado(servico):
    criar_jogo(servico, "Fallout 1", "PC")

    with pytest.raises(GameAlreadyExistsError):
        criar_jogo(servico, "Fallout 1", "PC")


@pytest.mark.parametrize(
    "titulo, plataforma",
    [
        ("fallout 1", "PC"),
        ("Fallout 1", "pc"),
        ("  Fallout 1  ", "PC"),
        ("Fallout 1", "  PC  "),
        ("  FALLOUT 1  ", "  pc  "),
    ],
)
def test_cadastro_duplicata_normalizada(servico, titulo, plataforma):
    criar_jogo(servico, "Fallout 1", "PC")

    with pytest.raises(GameAlreadyExistsError):
        criar_jogo(servico, titulo, plataforma)


def test_cadastro_duplicata_em_estados_diferentes(servico):
    criar_jogo(
        servico,
        "Fallout 1",
        estado=GameStatus.QUERO_JOGAR,
    )

    with pytest.raises(GameAlreadyExistsError):
        criar_jogo(
            servico,
            "Fallout 1",
            estado=GameStatus.JOGANDO,
        )


# --------------------------------------------------
# Consulta e listagem
# --------------------------------------------------


def test_consulta_jogo_existente(servico):
    jogo = criar_jogo(servico)

    resultado = servico.get(jogo.id)

    assert resultado == jogo


def test_consulta_jogo_inexistente(servico):
    with pytest.raises(GameNotFoundError):
        servico.get(999)


def test_listagem_vazia(servico):
    assert servico.list() == []


def test_listagem_jogos_cadastrados(servico):
    primeiro = criar_jogo(servico, "GTA VI")
    segundo = criar_jogo(servico, "Fallout 1")

    jogos = servico.list()

    assert jogos == [primeiro, segundo]


@pytest.mark.parametrize("estado", list(GameStatus))
def test_listagem_filtrada_por_estado(servico, estado):
    for indice, estado_jogo in enumerate(GameStatus):
        criar_jogo(
            servico,
            titulo=f"Jogo {indice}",
            estado=estado_jogo,
        )

    jogos = servico.list(estado)

    assert [jogo.estado for jogo in jogos] == [estado]


def test_listagem_ordenada_por_posicao(servico):
    primeiro = criar_jogo(servico, "GTA VI")
    segundo = criar_jogo(servico, "Fallout 1")

    servico.update_position(
        segundo.id,
        GamePositionUpdate(direcao="subir"),
    )

    jogos = servico.list(GameStatus.QUERO_JOGAR)

    assert [jogo.id for jogo in jogos] == [
        segundo.id,
        primeiro.id,
    ]


def test_armazenamentos_independentes(servico):
    outro_servico = GameService()

    criar_jogo(servico)

    assert outro_servico.list() == []


def test_consulta_nao_permite_modificar_armazenamento(servico):
    jogo = criar_jogo(servico)

    resultado = servico.get(jogo.id)
    resultado.posicao = 100

    assert servico.get(jogo.id).posicao == 1


def test_listagem_nao_permite_modificar_armazenamento(servico):
    jogo = criar_jogo(servico)

    jogos = servico.list()
    jogos[0].posicao = 100

    assert servico.get(jogo.id).posicao == 1


# --------------------------------------------------
# Edição
# --------------------------------------------------


def test_edicao_jogo_valido(
    servico,
    dados_jogo,
    dados_atualizados,
):
    jogo = servico.create(GameCreate(**dados_jogo))

    servico.update(
        jogo.id,
        GameUpdate(**dados_atualizados),
    )

    atualizado = servico.get(jogo.id)

    assert atualizado.titulo == dados_atualizados["titulo"]
    assert atualizado.plataforma == dados_atualizados["plataforma"]
    assert atualizado.vezes_finalizado == dados_atualizados["vezes_finalizado"]
    assert atualizado.anotacoes == dados_atualizados["anotacoes"]


def test_edicao_jogo_inexistente(servico, dados_atualizados):
    with pytest.raises(GameNotFoundError):
        servico.update(999, GameUpdate(**dados_atualizados))


def test_edicao_preserva_identificador(servico, dados_atualizados):
    jogo = criar_jogo(servico)

    atualizado = servico.update(
        jogo.id,
        GameUpdate(**dados_atualizados),
    )

    assert atualizado.id == jogo.id


def test_edicao_preserva_estado(servico, dados_atualizados):
    jogo = criar_jogo(servico, estado=GameStatus.JOGANDO)

    atualizado = servico.update(
        jogo.id,
        GameUpdate(**dados_atualizados),
    )

    assert atualizado.estado == GameStatus.JOGANDO


def test_edicao_preserva_posicao(servico, dados_atualizados):
    criar_jogo(servico, "Dark Souls")
    jogo = criar_jogo(servico, "GTA VI")

    atualizado = servico.update(
        jogo.id,
        GameUpdate(**dados_atualizados),
    )

    assert atualizado.posicao == 2


def test_edicao_jogo_duplicado(servico, dados_atualizados):
    criar_jogo(servico, "Fallout 1", "PC")
    jogo = criar_jogo(servico, "GTA VI", "PC")

    with pytest.raises(GameAlreadyExistsError):
        servico.update(
            jogo.id,
            GameUpdate(**dados_atualizados),
        )


@pytest.mark.parametrize(
    "titulo, plataforma",
    [
        ("fallout 1", "PC"),
        ("Fallout 1", "pc"),
        ("  Fallout 1  ", "PC"),
        ("Fallout 1", "  PC  "),
        ("  FALLOUT 1  ", "  pc  "),
    ],
)
def test_edicao_duplicata_normalizada(
    servico,
    dados_atualizados,
    titulo,
    plataforma,
):
    criar_jogo(servico, "Fallout 1", "PC")
    jogo = criar_jogo(servico, "GTA VI", "PC")

    dados_atualizados["titulo"] = titulo
    dados_atualizados["plataforma"] = plataforma

    with pytest.raises(GameAlreadyExistsError):
        servico.update(
            jogo.id,
            GameUpdate(**dados_atualizados),
        )


def test_edicao_preserva_titulo_e_plataforma(
    servico,
    dados_jogo,
):
    jogo = servico.create(GameCreate(**dados_jogo))

    dados_jogo["anotacoes"] = "Jogo comprado."

    atualizado = servico.update(
        jogo.id,
        GameUpdate(**dados_jogo),
    )

    assert atualizado.anotacoes == "Jogo comprado."


def test_edicao_mesmo_titulo_plataformas_diferentes(
    servico,
    dados_atualizados,
):
    criar_jogo(servico, "Fallout 1", "Xbox")
    jogo = criar_jogo(servico, "GTA VI", "PC")

    atualizado = servico.update(
        jogo.id,
        GameUpdate(**dados_atualizados),
    )

    assert atualizado.titulo == "Fallout 1"


def test_edicao_remove_anotacoes(servico, dados_jogo):
    jogo = servico.create(GameCreate(**dados_jogo))
    dados_jogo["anotacoes"] = None

    atualizado = servico.update(
        jogo.id,
        GameUpdate(**dados_jogo),
    )

    assert atualizado.anotacoes is None


# --------------------------------------------------
# Exclusão
# --------------------------------------------------


def test_exclusao_jogo_existente(servico):
    jogo = criar_jogo(servico)

    servico.delete(jogo.id)

    assert servico.list() == []


def test_consulta_jogo_excluido(servico):
    jogo = criar_jogo(servico)

    servico.delete(jogo.id)

    with pytest.raises(GameNotFoundError):
        servico.get(jogo.id)


def test_exclusao_jogo_inexistente(servico):
    with pytest.raises(GameNotFoundError):
        servico.delete(999)


@pytest.mark.parametrize("indice", [0, 1, 2])
def test_exclusao_reorganiza_posicoes(servico, indice):
    jogos = [
        criar_jogo(servico, "GTA VI"),
        criar_jogo(servico, "Fallout 1"),
        criar_jogo(servico, "Dark Souls"),
    ]

    servico.delete(jogos[indice].id)

    restantes = servico.list(GameStatus.QUERO_JOGAR)

    assert [jogo.posicao for jogo in restantes] == [1, 2]


def test_exclusao_preserva_outras_listas(servico):
    primeiro = criar_jogo(servico, "GTA VI")
    segundo = criar_jogo(
        servico,
        "Fallout 1",
        estado=GameStatus.JOGANDO,
    )

    servico.delete(primeiro.id)

    assert servico.get(segundo.id) == segundo


def test_cadastro_nao_reutiliza_identificador_excluido(servico):
    primeiro = criar_jogo(servico, "GTA VI")

    servico.delete(primeiro.id)

    segundo = criar_jogo(servico, "Fallout 1")

    assert segundo.id > primeiro.id


def test_cadastro_permitido_apos_exclusao(servico):
    jogo = criar_jogo(servico)

    servico.delete(jogo.id)
    criar_jogo(servico)

    assert len(servico.list()) == 1
