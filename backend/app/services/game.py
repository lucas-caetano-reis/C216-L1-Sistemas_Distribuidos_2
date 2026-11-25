from app.schemas.game import (
    GameCreate,
    GamePositionUpdate,
    GameRead,
    GameStatus,
    GameStatusUpdate,
    GameUpdate,
)


class GameNotFoundError(Exception):
    pass


class GameAlreadyExistsError(Exception):
    pass


class GameInvalidCompletionCountError(Exception):
    pass


class GameInvalidPositionError(Exception):
    pass


class GameService:
    def __init__(self):
        self._jogos: dict[int, GameRead] = {}
        self._proximo_id = 1

    # --------------------------------------------------
    # Métodos auxiliares da classe
    # --------------------------------------------------

    def _buscar_jogo(self, jogo_id: int) -> GameRead:
        jogo = self._jogos.get(jogo_id)

        if jogo is None:
            raise GameNotFoundError("Jogo não encontrado.")

        return jogo

    def _verificar_duplicata(
        self,
        titulo: str,
        plataforma: str,
        jogo_id: int | None = None,
    ) -> None:
        titulo_normalizado = titulo.strip().casefold()
        plataforma_normalizada = plataforma.strip().casefold()

        for jogo in self._jogos.values():
            if jogo.id == jogo_id:
                continue

            if (
                jogo.titulo.strip().casefold() == titulo_normalizado
                and jogo.plataforma.strip().casefold() == plataforma_normalizada
            ):
                raise GameAlreadyExistsError(
                    "Já existe um jogo com esse título e plataforma."
                )

    def _validar_finalizacoes(
        self,
        estado: GameStatus,
        quantidade: int,
    ) -> None:
        if quantidade < 0:
            raise GameInvalidCompletionCountError(
                "A quantidade de finalizações não pode ser negativa."
            )

        if estado == GameStatus.FINALIZADO and quantidade == 0:
            raise GameInvalidCompletionCountError(
                "Um jogo finalizado deve possuir pelo menos uma finalização."
            )

    def _listar_por_estado(self, estado: GameStatus) -> list[GameRead]:
        jogos = [jogo for jogo in self._jogos.values() if jogo.estado == estado]

        return sorted(jogos, key=lambda jogo: jogo.posicao)

    def _proxima_posicao(self, estado: GameStatus) -> int:
        return len(self._listar_por_estado(estado)) + 1

    def _reorganizar_posicoes(
        self,
        estado: GameStatus,
    ) -> None:
        jogos = self._listar_por_estado(estado)

        for posicao, jogo in enumerate(jogos, start=1):
            jogo.posicao = posicao

    # --------------------------------------------------
    # CRUD
    # --------------------------------------------------

    def create(self, data: GameCreate) -> GameRead:
        self._verificar_duplicata(data.titulo, data.plataforma)

        quantidade = data.vezes_finalizado

        if (
            data.estado == GameStatus.FINALIZADO
            and "vezes_finalizado" not in data.model_fields_set
        ):
            quantidade = 1

        self._validar_finalizacoes(data.estado, quantidade)

        jogo = GameRead(
            id=self._proximo_id,
            titulo=data.titulo,
            plataforma=data.plataforma,
            vezes_finalizado=quantidade,
            anotacoes=data.anotacoes,
            estado=data.estado,
            posicao=self._proxima_posicao(data.estado),
        )

        self._jogos[jogo.id] = jogo
        self._proximo_id += 1

        return jogo.model_copy()

    def get(self, jogo_id: int) -> GameRead:
        return self._buscar_jogo(jogo_id).model_copy()

    def list(self, estado: GameStatus | None = None) -> list[GameRead]:
        if estado is not None:
            return [jogo.model_copy() for jogo in self._listar_por_estado(estado)]

        return [
            jogo.model_copy()
            for estado_jogo in GameStatus
            for jogo in self._listar_por_estado(estado_jogo)
        ]

    def update(self, jogo_id: int, data: GameUpdate) -> GameRead:
        jogo = self._buscar_jogo(jogo_id)

        self._verificar_duplicata(
            data.titulo,
            data.plataforma,
            jogo.id,
        )

        self._validar_finalizacoes(
            jogo.estado,
            data.vezes_finalizado,
        )

        if (
            jogo.titulo == data.titulo
            and jogo.plataforma == data.plataforma
            and jogo.vezes_finalizado == data.vezes_finalizado
            and jogo.anotacoes == data.anotacoes
        ):
            return jogo.model_copy()

        jogo.titulo = data.titulo
        jogo.plataforma = data.plataforma
        jogo.vezes_finalizado = data.vezes_finalizado
        jogo.anotacoes = data.anotacoes

        return jogo.model_copy()

    def delete(self, jogo_id: int) -> None:
        jogo = self._buscar_jogo(jogo_id)

        del self._jogos[jogo_id]

        self._reorganizar_posicoes(jogo.estado)

    # --------------------------------------------------
    # Ordenação
    # --------------------------------------------------

    def update_position(
        self,
        jogo_id: int,
        data: GamePositionUpdate,
    ) -> GameRead:
        jogo = self._buscar_jogo(jogo_id)
        jogos = self._listar_por_estado(jogo.estado)

        if data.direcao == "subir":
            nova_posicao = jogo.posicao - 1
        else:
            nova_posicao = jogo.posicao + 1

        if not 1 <= nova_posicao <= len(jogos):
            raise GameInvalidPositionError(
                "O jogo não pode ser movimentado nessa direção."
            )

        outro_jogo = jogos[nova_posicao - 1]

        jogo.posicao, outro_jogo.posicao = (
            outro_jogo.posicao,
            jogo.posicao,
        )

        return jogo.model_copy()

    # --------------------------------------------------
    # Movimentação entre estados
    # --------------------------------------------------

    def update_status(
        self,
        jogo_id: int,
        data: GameStatusUpdate,
    ) -> GameRead:
        jogo = self._buscar_jogo(jogo_id)

        if jogo.estado == data.estado:
            return jogo.model_copy()

        estado_anterior = jogo.estado
        nova_posicao = self._proxima_posicao(data.estado)

        if data.estado == GameStatus.FINALIZADO:
            jogo.vezes_finalizado += 1

        jogo.estado = data.estado
        jogo.posicao = nova_posicao
        self._reorganizar_posicoes(estado_anterior)

        return jogo.model_copy()
