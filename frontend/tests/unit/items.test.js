import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
} from "../../src/services/items";

function jsonResponse(data, options = {}) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(data),
    ...options,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("itemsService", () => {
  it("lista itens pela API", async () => {
    const items = [{ id: "1", name: "Notebook", description: null }];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(items));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listItems()).resolves.toEqual(items);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/items\/$/),
      undefined,
    );
  });

  it("cadastra item com POST e envia descrição vazia como null", async () => {
    const item = { id: "1", name: "Notebook", description: null };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(item, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createItem({ name: "Notebook", description: "" }),
    ).resolves.toEqual(item);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/items\/$/),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Notebook", description: null }),
      },
    );
  });

  it("busca item usando id codificado na URL", async () => {
    const item = { id: "item/1", name: "Notebook", description: null };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(item));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getItem("item/1")).resolves.toEqual(item);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/items\/item%2F1$/),
      undefined,
    );
  });

  it("atualiza item com PATCH e envia descrição vazia como null", async () => {
    const item = { id: "1", name: "Notebook Pro", description: null };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(item));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateItem("1", { name: "Notebook Pro", description: "" }),
    ).resolves.toEqual(item);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/items\/1$/),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Notebook Pro", description: null }),
      },
    );
  });

  it("remove item com DELETE e aceita resposta 204 sem corpo", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteItem("1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/items\/1$/),
      { method: "DELETE" },
    );
  });

  it("converte falha de conexão em mensagem legível", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(listItems()).rejects.toThrow(
      "Não foi possível conectar à API.",
    );
  });

  it("usa o detalhe retornado pela API em respostas HTTP de erro", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: vi
        .fn()
        .mockResolvedValue({ detail: "Já existe um item com esse nome" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createItem({ name: "Notebook", description: "" }),
    ).rejects.toThrow("Já existe um item com esse nome");
  });

  it("usa a mensagem padrão quando a resposta de erro não tem detail", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(listItems()).rejects.toThrow("Erro ao carregar os itens.");
  });
});
