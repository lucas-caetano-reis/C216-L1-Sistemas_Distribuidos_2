.PHONY: help install test lint format run clean

BACKEND_DIR := backend
PYTHON := poetry run python
POETRY := poetry install
PYTEST := poetry run pytest
UVICORN := poetry run uvicorn
RUFF := poetry run ruff
GET := powershell -Command "Get-ChildItem -Path . -Directory -Recurse -Filter
REMOVE := | Remove-Item -Recurse -Force"

help:
	@echo "Comandos disponíveis:"
	@echo "  make install  - instala dependências"
	@echo "  make test     - executa testes"
	@echo "  make lint     - verifica o código"
	@echo "  make format   - formata o código"
	@echo "  make run      - inicia o servidor"
	@echo "  make clean    - remove arquivos temporários"

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
