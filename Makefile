.PHONY: help install test lint format run clean up up-build down down-v build logs logs-api ps shell db-upgrade db-downgrade db-current db-history db-migration db-psql frontend-ci frontend-dev frontend-lint frontend-check frontend-format frontend-test frontend-chromium frontend-test-e2e

BACKEND_DIR := backend
FRONTEND_DIR := frontend
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
	@echo "  make db-upgrade   - aplica as migrations pendentes com o Alembic"
	@echo "  make db-downgrade - desfaz a ultima migration"
	@echo "  make db-current   - mostra a versao atual do banco"
	@echo "  make db-history   - lista o historico de migrations"
	@echo "  make db-migration MSG=\"descricao\" - gera uma nova migration"
	@echo "  make db-psql      - abre o psql no container do PostgreSQL"
	@echo "  make frontend-ci  - faz uma instalacao limpa das dependencias do frontend"
	@echo "  make frontend-dev - inicia o frontend via Vite em um servidor local"
	@echo "  make frontend-lint     - verifica os arquivos do frontend com o Biome"
	@echo "  make frontend-check    - faz o linting e procura por erros de formatacao, mas nao altera codigos"
	@echo "  make frontend-format   - formata o frontend com o Biome"
	@echo "  make frontend-test     - executa os testes do frontend com o Vitest"
	@echo "  make frontend-chromium - instala o chromium na sua maquina (necessario para os testes E2E); uma instalacao por maquina"
	@echo "  make frontend-test-e2e - executa os testes E2E com o Playwright"

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
	cd $(FRONTEND_DIR) && $(GET) 'test-results' $(REMOVE)

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

frontend-ci:
	cd $(FRONTEND_DIR) && npm ci

frontend-dev:
	cd $(FRONTEND_DIR) && npm run dev

frontend-lint:
	cd $(FRONTEND_DIR) && npm run lint

frontend-check:
	cd $(FRONTEND_DIR) && npm run check

frontend-format:
	cd $(FRONTEND_DIR) && npm run format

frontend-test:
	cd $(FRONTEND_DIR) && npm run test

frontend-chromium:
	cd $(FRONTEND_DIR) && npx playwright install chromium

frontend-test-e2e:
	cd $(FRONTEND_DIR) && npm run test:e2e