from pydantic import BaseModel


class UserCreate(BaseModel):
    nome: str
    email: str | None = None


class UserUpdate(BaseModel):
    nome: str | None = None
    email: str | None = None
