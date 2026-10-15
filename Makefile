.PHONY: help install test lint format run clean up up-build down down-v build logs logs-api ps shell db-upgrade db-downgrade db-current db-history db-migration db-psql

BACKEND_DIR := backend
PYTHON := poetry run python
POETRY := poetry install
PYTEST := poetry run pytest
UVICORN := poetry run uvicorn
RUFF := poetry run ruff
GET := powershell -Command "Get-ChildItem -Path . -Directory -Recurse -Filter
REMOVE := | Remove-Item -Recurse -Force"
COMPOSE := docker compose
ALEMBIC := exec api alembic

help:
	@echo "Comandos disponiveis:"
	@echo "  make install  - instala dependencias"
	@echo "  make test     - executa testes"
	@echo "  make test-v   - executa testes e mostra detalhes das execucoes"
	@echo "  make lint     - verifica o codigo com ruff"
	@echo "  make format   - formata o codigo com ruff"
	@echo "  make run      - inicia o servidor"
	@echo "  make clean    - remove arquivos temporarios"
	@echo "  make up       - sobe os containers"
	@echo "  make up-build - reconstroi a imagem e sobe os containers"
	@echo "  make down     - para e remove os containers"
	@echo "  make down-v   - remove containers, rede e volumes do Compose"
	@echo "  make build    - constroi as imagens"
	@echo "  make logs     - acompanha os logs"
	@echo "  make logs-api - acompanha apenas os logs da API"
	@echo "  make ps       - mostra o status dos servicos"
	@echo "  make shell    - abre um shell no container da API"
	@echo "  make db-upgrade   - aplica as migrations pendentes (Alembic)"
	@echo "  make db-downgrade - desfaz a ultima migration"
	@echo "  make db-current   - mostra a versao atual do banco"
	@echo "  make db-history   - lista o historico de migrations"
	@echo "  make db-migration MSG=\"descricao\" - gera uma nova migration"
	@echo "  make db-psql      - abre o psql no container do PostgreSQL"

install:
	cd $(BACKEND_DIR) && $(POETRY) --no-root

test:
	cd $(BACKEND_DIR) && $(PYTEST)

test-v:
	cd $(BACKEND_DIR) && $(PYTEST) -v

lint:
	cd $(BACKEND_DIR) && $(RUFF) check .

format:
	cd $(BACKEND_DIR) && $(RUFF) format .

run:
	cd $(BACKEND_DIR) && $(UVICORN) app.main:app --reload

clean:
	cd $(BACKEND_DIR) && $(GET) '__pycache__' $(REMOVE)
	cd $(BACKEND_DIR) && $(GET) '.pytest_cache' $(REMOVE)
	cd $(BACKEND_DIR) && $(GET) '.ruff_cache' $(REMOVE)

up:
	$(COMPOSE) up -d

up-build:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

down-v:
	$(COMPOSE) down -v

build:
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f

logs-api:
	$(COMPOSE) logs -f api

ps:
	$(COMPOSE) ps

shell:
	$(COMPOSE) exec api sh

db-upgrade:
	$(COMPOSE) $(ALEMBIC) upgrade head

db-downgrade:
	$(COMPOSE) $(ALEMBIC) downgrade -1

db-current:
	$(COMPOSE) $(ALEMBIC) current

db-history:
	$(COMPOSE) $(ALEMBIC) history

db-migration:
	@test -n "$(MSG)" || (echo "Uso: make db-migration MSG=\"descricao\"" && exit 1)
	$(COMPOSE) run --rm -v "$(CURDIR)/backend/alembic/versions:/app/alembic/versions" api alembic revision --autogenerate -m "$(MSG)"

db-psql:
	$(COMPOSE) exec db sh -c 'psql -U $$POSTGRES_USER -d $$POSTGRES_DB'
