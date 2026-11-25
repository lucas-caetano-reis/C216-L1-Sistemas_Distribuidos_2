from fastapi import FastAPI

from app.api.routes.games import router as games_router

app = FastAPI()

app.include_router(games_router)


@app.get("/")
def root():
    return {"message": "A API está funcionando!"}
