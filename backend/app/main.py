from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.items import router as items_router
from app.core.config import CORS_ORIGINS

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(items_router)


@app.get("/")
def root():
    return {"message": "A API está funcionando!"}
