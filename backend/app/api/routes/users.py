from fastapi import APIRouter

from app.models.user import UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/")
def list_users(limit: int = 10):
    return {"limit": limit}


# -----------------------------------------------


@router.post("/")
def create_user(user: UserCreate):
    return user


# -----------------------------------------------


@router.get("/{user_id}")
def get_user(user_id: int):
    return {"user_id": user_id}


# -----------------------------------------------


@router.delete("/{user_id}")
def delete_user(user_id: int):
    return {"user_id": user_id, "message": "Usuário removido com sucesso"}


# -----------------------------------------------


@router.put("/{user_id}")
def update_user(user_id: int, user: UserCreate):
    return {"user_id": user_id, "nome": user.nome, "email": user.email}


# -----------------------------------------------


@router.patch("/{user_id}")
def patch_user(user_id: int, user: UserUpdate):
    return {"user_id": user_id, "nome": user.nome, "email": user.email}
