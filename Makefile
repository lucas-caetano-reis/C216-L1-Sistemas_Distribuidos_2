.PHONY: help version install info test test-v cov lint format run clean up up-build down down-v build logs logs-api ps back-sh

BACKEND := cd backend
POETRY := poetry run
GET_DIR := powershell -Command "Get-ChildItem -Path . -Directory -Recurse -Filter
GET_FILE := powershell -Command "Get-ChildItem -Path . -File -Recurse -Filter
REMOVE := | Remove-Item -Recurse -Force"
COMPOSE := docker compose

help:
	@echo "Comandos disponiveis:"
	@echo "  make version  - verifica a versao do poetry na maquina"
	@echo "  make install  - instala dependencias"
	@echo "  make info     - verifica as informacoes sobre o ambiente virtual, versao do python e dependencias instaladas"
	@echo "  make test     - executa testes"
	@echo "  make test-v   - executa testes e mostra detalhes das execucoes"
	@echo "  make cov      - verifica a cobertura de testes"
	@echo "  make lint     - verifica o codigo"
	@echo "  make format   - formata o codigo"
	@echo "  make run      - inicia o servidor"
	@echo "  make clean    - remove arquivos temporarios"
	@echo "  make up       - sobe os containers"
	@echo "  make up-build - reconstroi a imagem e sobe os containers"
	@echo "  make down     - para e remove os containers"
	@echo "  make down-v   - remove containers, rede e volumes (dados persistentes) do Compose"
	@echo "  make build    - constroi/reconstroi as imagens"
	@echo "  make logs     - mostra os logs do container"
	@echo "  make logs-api - mostra apenas os logs relativos a API"
	@echo "  make ps       - mostra o status dos servicos"
	@echo "  make back-sh  - abre um shell no container da API"

version:
	poetry --version

install:
	$(BACKEND) && poetry install --no-root

info:
	$(BACKEND) && poetry env info
	$(BACKEND) && $(POETRY) python --version
	$(BACKEND) && poetry show

test:
	$(BACKEND) && $(POETRY) pytest

test-v:
	$(BACKEND) && $(POETRY) pytest -v

cov:
	$(BACKEND) && $(POETRY) pytest --cov

lint:
	$(BACKEND) && $(POETRY) ruff check .

format:
	$(BACKEND) && $(POETRY) ruff format .

run:
	$(BACKEND) && $(POETRY) uvicorn app.main:app --reload

clean:
	$(BACKEND) && $(GET_DIR) '__pycache__' $(REMOVE)
	$(BACKEND) && $(GET_DIR) '.pytest_cache' $(REMOVE)
	$(BACKEND) && $(GET_DIR) '.ruff_cache' $(REMOVE)
	$(BACKEND) && $(GET_FILE) '.coverage' $(REMOVE)

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

back-sh:
	$(COMPOSE) exec api sh
