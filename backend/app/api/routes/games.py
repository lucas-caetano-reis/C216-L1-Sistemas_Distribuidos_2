from fastapi import APIRouter, HTTPException, Response, status

from app.schemas.game import (
    GameCreate,
    GamePositionUpdate,
    GameRead,
    GameStatus,
    GameStatusUpdate,
    GameUpdate,
)
from app.services.game import (
    GameAlreadyExistsError,
    GameInvalidCompletionCountError,
    GameInvalidPositionError,
    GameNotFoundError,
    GameService,
)

router = APIRouter(prefix="/games", tags=["Games"])

service = GameService()


@router.get("/", response_model=list[GameRead])
def list_games(estado: GameStatus | None = None):
    return service.list(estado)


@router.post(
    "/",
    response_model=GameRead,
    status_code=status.HTTP_201_CREATED,
)
def create_game(data: GameCreate):
    try:
        return service.create(data)
    except GameAlreadyExistsError as erro:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro),
        ) from None
    except GameInvalidCompletionCountError as erro:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(erro),
        ) from None


@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: int):
    try:
        return service.get(game_id)
    except GameNotFoundError as erro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro),
        ) from None


@router.put("/{game_id}", response_model=GameRead)
def update_game(game_id: int, data: GameUpdate):
    try:
        return service.update(game_id, data)
    except GameNotFoundError as erro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro),
        ) from None
    except GameAlreadyExistsError as erro:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro),
        ) from None
    except GameInvalidCompletionCountError as erro:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(erro),
        ) from None


@router.delete(
    "/{game_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_game(game_id: int):
    try:
        service.delete(game_id)
    except GameNotFoundError as erro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro),
        ) from None

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{game_id}/position", response_model=GameRead)
def update_game_position(game_id: int, data: GamePositionUpdate):
    try:
        return service.update_position(game_id, data)
    except GameNotFoundError as erro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro),
        ) from None
    except GameInvalidPositionError as erro:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro),
        ) from None


@router.patch("/{game_id}/status", response_model=GameRead)
def update_game_status(game_id: int, data: GameStatusUpdate):
    try:
        return service.update_status(game_id, data)
    except GameNotFoundError as erro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro),
        ) from None
