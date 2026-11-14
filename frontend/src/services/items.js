export const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const ITEMS_URL = `${API_URL}/items/`;

async function request(url, options, defaultError) {
  let response;

  // Trata falhas de conexão, incluindo bloqueios por CORS.
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("Não foi possível conectar à API.");
  }

  // Respostas HTTP de erro não fazem o fetch rejeitar a requisição.
  if (!response.ok) {
    const data = await response.json().catch(() => null);

    const message =
      typeof data?.detail === "string" && data.detail.trim()
        ? data.detail
        : defaultError;

    throw new Error(message);
  }

  // O método DELETE retorna o código 204, sem um corpo para converter em JSON.
  if (response.status === 204) {
    return;
  }

  return response.json();
}

export function listItems() {
  return request(ITEMS_URL, undefined, "Erro ao carregar os itens.");
}

export function getItem(id) {
  return request(
    `${ITEMS_URL}${encodeURIComponent(id)}`,
    undefined,
    "Erro ao carregar o item.",
  );
}

export function createItem({ name, description }) {
  return request(
    ITEMS_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: description || null,
      }),
    },
    "Erro ao cadastrar o item.",
  );
}

export function updateItem(id, { name, description }) {
  return request(
    `${ITEMS_URL}${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: description === "" ? null : description,
      }),
    },
    "Erro ao atualizar o item.",
  );
}

export function deleteItem(id) {
  return request(
    `${ITEMS_URL}${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
    "Erro ao remover o item.",
  );
}
