from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    nome: str
    email: str | None = None


class UserUpdate(BaseModel):
    nome: str | None = None
    email: str | None = None


class ItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class ItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None


class ItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
