from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import DATABASE_URL

# A engine é criada uma única vez e mantém o pool de conexões.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


# Fábrica de sessões
SessionLocal = sessionmaker(bind=engine, autoFlush=False, autoCommit=False)


# Fornecedora de sessões
def get_db() -> Iterator[Session]:
    """Dependência do FastAPI: uma sessão por requisição, sempre fechada."""
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
