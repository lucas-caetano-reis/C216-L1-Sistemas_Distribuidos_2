from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class GameStatus(StrEnum):
    QUERO_JOGAR = "quero_jogar"
    JOGANDO = "jogando"
    FINALIZADO = "finalizado"


class GameCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    titulo: str = Field(min_length=1, max_length=200)
    plataforma: str = Field(min_length=1, max_length=50)
    vezes_finalizado: int = Field(default=0, ge=0)
    anotacoes: str | None = Field(default=None, max_length=2000)
    estado: GameStatus = GameStatus.QUERO_JOGAR


class GameUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    titulo: str = Field(min_length=1, max_length=200)
    plataforma: str = Field(min_length=1, max_length=50)
    vezes_finalizado: int = Field(ge=0)
    anotacoes: str | None = Field(default=None, max_length=2000)


class GameRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    plataforma: str
    vezes_finalizado: int
    anotacoes: str | None = None
    estado: GameStatus
    posicao: int


class GamePositionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    direcao: Literal["subir", "descer"]


class GameStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    estado: GameStatus
