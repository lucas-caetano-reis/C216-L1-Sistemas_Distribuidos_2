.PHONY: help version install info test lint format run clean

BACKEND := cd backend
POETRY := poetry run
GET := powershell -Command "Get-ChildItem -Path . -Directory -Recurse -Filter
REMOVE := | Remove-Item -Recurse -Force"

help:
	@echo "Comandos disponiveis:"
	@echo "  make version  - verifica a versão do poetry na maquina"
	@echo "  make install  - instala dependencias"
	@echo "  make info     - verifica as informacoes sobre o ambiente virtual, versao do python e dependencias instaladas"
	@echo "  make test     - executa testes"
	@echo "  make lint     - verifica o codigo"
	@echo "  make format   - formata o codigo"
	@echo "  make run      - inicia o servidor"
	@echo "  make clean    - remove arquivos temporarios"

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

lint:
	$(BACKEND) && $(POETRY) ruff check .

format:
	$(BACKEND) && $(POETRY) ruff format .

run:
	$(BACKEND) && $(POETRY) uvicorn src.app.main:app --reload

clean:
	$(BACKEND) && $(GET) '__pycache__' $(REMOVE)
	$(BACKEND) && $(GET) '.pytest_cache' $(REMOVE)
	$(BACKEND) && $(GET) '.ruff_cache' $(REMOVE)