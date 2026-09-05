.PHONY: help install test lint format run clean up up-build down down-v build logs logs-api ps shell

BACKEND_DIR := backend
PYTHON := poetry run python
POETRY := poetry install
PYTEST := poetry run pytest
UVICORN := poetry run uvicorn
RUFF := poetry run ruff
GET := powershell -Command "Get-ChildItem -Path . -Directory -Recurse -Filter
REMOVE := | Remove-Item -Recurse -Force"
COMPOSE := docker compose
UP := up -d
DOWN := down
LOGS := logs -f

help:
	@echo "Comandos disponíveis:"
	@echo "  make install  - instala dependências"
	@echo "  make test     - executa testes"
	@echo "  make lint     - verifica o código"
	@echo "  make format   - formata o código"
	@echo "  make run      - inicia o servidor"
	@echo "  make clean    - remove arquivos temporários"
	@echo "  make up       - sobe os containers"
	@echo "  make up-build - reconstroi a imagem e sobe os containers"
	@echo "  make down     - para e remove os containers"
	@echo "  make down-v   - remove containers, rede e volumes do Compose"
	@echo "  make build    - constroi as imagens"
	@echo "  make logs     - acompanha os logs"
	@echo "  make logs-api - acompanha apenas os logs da API"
	@echo "  make ps       - mostra o status dos serviços"
	@echo "  make shell    - abre um shell no container da API"

install:
	cd $(BACKEND_DIR) && $(POETRY)

test:
	cd $(BACKEND_DIR) && $(PYTEST)

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
	$(COMPOSE) $(UP)

up-build:
	$(COMPOSE) $(UP) --build

down:
	$(COMPOSE) $(DOWN)

down-v:
	$(COMPOSE) $(DOWN) -v

build:
	$(COMPOSE) build

logs:
	$(COMPOSE) $(LOGS)

logs-api:
	$(COMPOSE) $(LOGS) api

ps:
	$(COMPOSE) ps

shell:
	$(COMPOSE) exec api sh
