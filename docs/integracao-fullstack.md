# Prática 7 — Integração Full-stack: CORS, E2E e Multicontêiner

> **Disciplina:** C216 — Sistemas Distribuídos  
> **Módulo:** Frontend & Consumo  
> **Objetivo:** integrar frontend, API e banco de dados, concluindo o laboratório web.

---

## 1. Onde estamos?

Nas práticas anteriores, construímos:

- **Backend:** FastAPI, rotas de `items`, SQLAlchemy, Alembic e PostgreSQL.
- **Frontend:** React + Vite + Tailwind, com formulário e listagem usando `useState`.
- **Qualidade:** Pytest, Vitest e Playwright.
- **Infraestrutura:** Docker e Docker Compose.

**Nesta prática:** o frontend deixa de manter os itens apenas em memória e passa a consumir a API, que persiste os dados no PostgreSQL.

```text
Navegador (React/Vite)  :5173
        │ HTTP (fetch) — origem diferente → exige CORS
        ▼
   API FastAPI          :8000
        │ SQLAlchemy (host "db" na rede Docker)
        ▼
   PostgreSQL           :5432
```

## 2. Fluxo completo de uma requisição

Cadastro de um item, do clique ao banco e de volta:

```text
1. ItemForm        valida (validateItem) e chama onAdd(values)
2. App.addItem     chama createItem() → fetch POST http://localhost:8000/items/
3. Navegador       envia antes um preflight (OPTIONS); o CORSMiddleware autoriza a origem
4. Route           items.py recebe o JSON; o schema ItemCreate valida (422 se inválido)
5. Service         ItemService.create aplica a regra: nome único (409 se já existir)
6. Repository      ItemRepository.create faz INSERT via SQLAlchemy
7. PostgreSQL      grava a linha na tabela items
8. Route           responde 201 com o schema ItemRead (id, name, description)
9. App             recebe o JSON e adiciona o item ao estado → a lista é re-renderizada
```

Ao recarregar a página, o `useEffect` de `App` faz `GET /items/` e a lista volta do banco — é isso que prova a persistência.

## 3. Backend: o que a API já expõe

Nenhuma rota nova foi necessária. O frontend usa duas das rotas criadas na Prática 5:

| Método | Rota | Sucesso | Erros |
| --- | --- | --- | --- |
| `GET` | `/items/` | `200` com lista de `ItemRead` | — |
| `POST` | `/items/` | `201` com o `ItemRead` criado | `409` nome duplicado, `422` corpo inválido |

- **Schemas** (`app/schemas/item.py`) validam a entrada (`ItemCreate`: nome de 1 a 100 caracteres) e serializam a saída (`ItemRead`). O frontend repete a regra do nome em `validation.js` só para dar feedback rápido — **o backend continua sendo a fonte da verdade**.
- **Camadas:** route (HTTP) → service (regras) → repository (SQL). O frontend não sabe nada disso; só conhece o contrato JSON.
- **Atenção à barra final:** as rotas são `/items/`. Chamar `/items` provoca um redirecionamento `307`, que o navegador pode tratar mal em requisições com CORS. Por isso o frontend usa `/items/`.
- Os erros `409` trazem `{"detail": "Já existe um item com esse nome"}`; o frontend exibe esse texto ao usuário.

## 4. CORS: por que configurar?

`http://localhost:5173` (frontend) e `http://localhost:8000` (API) têm **portas diferentes**, logo são **origens diferentes**. O navegador bloqueia a leitura da resposta, a menos que a API autorize a origem.

`backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
```

`backend/app/core/config.py` lê as origens da variável `CORS_ORIGINS` (lista separada por vírgulas). O padrão é `http://localhost:5173,http://127.0.0.1:5173`. Nada de `"*"`: só liberamos o que o frontend realmente usa.

**Importante:** CORS é uma regra aplicada pelo **navegador**. `curl` e outros servidores ignoram essa regra, então CORS **não substitui** autenticação nem controle de acesso.

## 5. Frontend: consumindo a API com `fetch`

### 5.1 Cliente HTTP — `frontend/src/services/items.js`

Todas as chamadas HTTP ficam em um único módulo. A URL vem da variável do Vite `VITE_API_URL`:

```js
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const ITEMS_URL = `${API_URL}/items/`;

export function listItems() {
  return request(ITEMS_URL, undefined, "Erro ao carregar os itens.");
}

export function createItem({ name, description }) {
  return request(
    ITEMS_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null }),
    },
    "Erro ao cadastrar o item.",
  );
}
```

A função `request` trata os três cenários:

| Situação | O que acontece |
| --- | --- |
| API inacessível | `fetch` rejeita → `Error("Não foi possível conectar à API.")` |
| Resposta `!response.ok` | `fetch` **não** rejeita em 4xx/5xx; lemos `detail` (texto) ou usamos a mensagem padrão |
| Sucesso | `response.json()` |

> `VITE_*` é exposta ao código do navegador: **nunca** coloque senhas ali.

### 5.2 Componentes — `App.jsx` e `ItemForm.jsx`

O `useState` agora guarda apenas **estado de interface**; a fonte dos dados é o banco.

```jsx
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState("");

useEffect(() => {
  listItems()
    .then(setItems)
    .catch((error) => setLoadError(error.message))
    .finally(() => setLoading(false));
}, []);

async function addItem(values) {
  const created = await createItem(values); // lança erro se falhar
  setItems((current) => [...current, created]);
}
```

- **Carregamento:** `Carregando itens...` até a primeira resposta.
- **Erro de listagem:** mensagem em `role="alert"`.
- **Cadastro:** `ItemForm` chama `await onAdd(values)`; em caso de sucesso limpa os campos, em caso de erro mostra a mensagem (ex.: nome duplicado) e **mantém o que foi digitado**. O botão fica desabilitado enquanto salva.
- As validações da Prática 6 continuam: nome inválido nem chega à API.

## 6. Docker Compose: três serviços

`compose.yml` agora tem `db`, `api` e `frontend`:

```yaml
frontend:
  build:
    context: ./frontend
  ports:
    - "${FRONTEND_PORT:-5173}:5173"
  environment:
    VITE_API_URL: ${VITE_API_URL:-http://localhost:${API_PORT:-8000}}
  depends_on:
    api:
      condition: service_healthy
```

- `frontend/Dockerfile` roda o servidor de desenvolvimento do Vite (`--host 0.0.0.0`).
- A `api` ganhou um *healthcheck* e recebe `CORS_ORIGINS`; o `frontend` só inicia depois que a API está saudável, e a API só depois do banco (Prática 5).
- Como nos demais serviços, o código é **copiado** para a imagem: após alterar o código, use `make up-build`.

### `localhost` × nome do serviço

| Quem faz a chamada | Endereço da API / banco |
| --- | --- |
| **Navegador** no seu computador | `http://localhost:8000` |
| **Contêiner `api`** → banco | `db:5432` (`DATABASE_URL`) |
| Contêiner → outro contêiner | `http://api:8000` (nome do serviço) |

O código React **executa no navegador**, não no contêiner. Por isso `VITE_API_URL` aponta para `localhost:8000` (porta publicada no host) e **não** para `http://api:8000`, que o navegador não consegue resolver. Já dentro do contêiner `api`, `localhost` é o próprio contêiner — por isso o banco é acessado como `db`.

> Usamos a URL pública local em vez de um proxy do Vite: é mais simples e deixa explícito o conceito de CORS.

### Subindo e migrando

```bash
cp .env.example .env        # primeira vez
make up-build               # db + api + frontend
make db-upgrade             # aplica as migrations (Alembic)
```

- Frontend: <http://localhost:5173>
- API / Swagger: <http://localhost:8000/docs>

> O banco vazio não tem a tabela `items`: sem `make db-upgrade` as consultas à tabela falham (erro no servidor).

## 7. Testes: três níveis

| Tipo | Ferramenta | O que verifica | Dependências |
| --- | --- | --- | --- |
| **Unitário** | Vitest | uma peça isolada (`validation.js`, `ItemList`, `services/items.js`) | nenhuma |
| **Integração** | Vitest + Testing Library | componentes juntos (`App` + `ItemForm` + `ItemList`) com `fetch` **mockado** | nenhuma |
| **E2E** | Playwright | navegador real → React → FastAPI → PostgreSQL | stack completa |

### Mock de `fetch` (unitário/integração)

```js
vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(data)));
```

Os testes cobrem: carregando, lista vazia, itens vindos da API, erro de conexão, erro `409` e envio do `POST`.

### Backend

`tests/test_main.py` ganhou dois testes de CORS (origem permitida e origem desconhecida). Os demais testes continuam usando SQLite em memória.

### E2E full-stack — `frontend/tests/e2e/items.spec.js`

```js
test("cadastra um item e ele persiste após recarregar a página", async ({ page }) => {
  const name = uniqueName("Notebook");
  await page.goto("/");
  await page.getByLabel("Nome").fill(name);
  await page.getByRole("button", { name: "Adicionar" }).click();

  const item = page.getByRole("listitem").filter({ hasText: name });
  await expect(item).toBeVisible();

  await page.reload();
  await expect(item).toBeVisible(); // veio do PostgreSQL
});
```

Sem mocks: usa a API e o banco reais. Os nomes são únicos (`Date.now()`), então o teste não depende de dados prévios.

**Isolamento:** `make e2e` sobe uma stack **separada** da de desenvolvimento — projeto Compose `lab-e2e`, portas `8001` (API) e `5174` (frontend) e um volume próprio do PostgreSQL:

```bash
make e2e
```

O alvo sobe os serviços, aplica as migrations, roda o Playwright e, ao final, derruba tudo com `down -v` (o banco de teste é apagado; o de desenvolvimento nunca é tocado). `make frontend-test-e2e` apenas executa o Playwright contra uma stack já no ar (variável `E2E_BASE_URL`, padrão `http://localhost:5173`).

## 8. Makefile

| Comando | Função |
| --- | --- |
| `make up-build` / `make down` | sobe / derruba db, api e frontend |
| `make db-upgrade` | aplica as migrations |
| `make test` | testes do backend |
| `make frontend-test` | Vitest (unitários e integração) |
| `make e2e` | E2E full-stack em stack isolada |
| `make lint` / `make format` | Ruff |
| `make frontend-check` / `make frontend-build` | Biome / build do Vite |
| `make check-all` | tudo acima (exige Docker) |

O CI do frontend (`ci-frontend.yml`) passa a executar `make e2e` no lugar do Playwright isolado.

## 9. Atividade prática

Evolua o mesmo repositório das práticas anteriores:

- [ ] Criar `src/services/items.js` com `listItems` e `createItem` usando `fetch`.
- [ ] Trocar o estado local por chamadas à API, com carregamento e mensagens de erro.
- [ ] Configurar CORS no FastAPI com origens explícitas (variável `CORS_ORIGINS`).
- [ ] Criar `frontend/Dockerfile` e adicionar o serviço `frontend` ao `compose.yml`.
- [ ] Atualizar os testes Vitest para mockar `fetch` (carregando, sucesso, erro).
- [ ] Adaptar o E2E para provar a persistência após `page.reload()`.
- [ ] Executar `make check-all` sem quebrar o backend.

## 10. Checklist final de validação

- [ ] `make up-build` sobe `db`, `api` e `frontend` (todos `healthy` em `make ps`).
- [ ] `make db-upgrade` aplica a migration; `make db-current` mostra `(head)`.
- [ ] <http://localhost:8000/docs> abre e <http://localhost:5173> carrega a interface.
- [ ] Cadastrar um item pela interface o exibe na lista.
- [ ] Recarregar a página (F5) mantém o item.
- [ ] Cadastrar o mesmo nome de novo mostra "Já existe um item com esse nome".
- [ ] A aba *Network* do navegador mostra `OPTIONS` + `POST /items/` e o cabeçalho `access-control-allow-origin`.
- [ ] `make test`, `make frontend-test`, `make frontend-check` e `make frontend-build` passam.
- [ ] `make e2e` passa e não deixa containers `lab-e2e` ativos.

## 11. Encerramento do laboratório

Com esta prática, reunimos os principais elementos do desenvolvimento web moderno: **interface, API REST, persistência, contêineres e testes automatizados**.

O projeto integrado também serve de base para o **Projeto Final**: evoluir funcionalidades, documentar decisões e demonstrar uma aplicação funcional de ponta a ponta.

**Critério de conclusão:** cadastrar um item pela interface, visualizá-lo após recarregar a página e demonstrar esse comportamento em um teste E2E com os serviços integrados.
