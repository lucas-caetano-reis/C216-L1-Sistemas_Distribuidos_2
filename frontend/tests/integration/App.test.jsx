import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

function jsonResponse(data, options = {}) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(data),
    ...options,
  };
}

function stubFetch(...responses) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("começa com a lista vazia quando a API não tem itens", async () => {
    stubFetch(jsonResponse([]));
    render(<App />);

    expect(
      await screen.findByText("Nenhum item cadastrado."),
    ).toBeInTheDocument();
  });

  it("mostra carregamento e exibe os itens recebidos da API", async () => {
    const response = deferred();
    const fetchMock = vi.fn().mockReturnValue(response.promise);
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(screen.getByText("Carregando itens...")).toBeInTheDocument();
    await act(async () => {
      response.resolve(
        jsonResponse([
          { id: "1", name: "Notebook", description: "14 polegadas" },
        ]),
      );
    });

    expect(await screen.findByText("Notebook")).toBeInTheDocument();
    expect(screen.getByText("14 polegadas")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/items\/$/),
      undefined,
    );
  });

  it("mostra erro ao carregar e permite tentar novamente", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(
      { ok: false, status: 500, json: vi.fn().mockResolvedValue({}) },
      jsonResponse([{ id: "1", name: "Mouse", description: "Sem fio" }]),
    );
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Erro ao carregar os itens.",
    );
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Mouse")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("mostra erro de conexão ao carregar a lista", async () => {
    stubFetch().mockRejectedValueOnce(new Error("offline"));
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar à API.",
    );
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeInTheDocument();
  });

  it("cadastra um item e o exibe na lista", async () => {
    const user = userEvent.setup();
    const created = {
      id: "1",
      name: "Notebook",
      description: "14 polegadas",
    };
    const fetchMock = stubFetch(
      jsonResponse([]),
      jsonResponse(created, { status: 201 }),
    );
    render(<App />);
    await screen.findByText("Nenhum item cadastrado.");

    await user.type(screen.getByLabelText("Nome"), "Notebook");
    await user.type(screen.getByLabelText("Descrição"), "14 polegadas");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(await screen.findByText("Notebook")).toBeInTheDocument();
    expect(screen.getByText("14 polegadas")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum item cadastrado."),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Item adicionado com sucesso.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("acumula vários itens cadastrados", async () => {
    const user = userEvent.setup();
    stubFetch(
      jsonResponse([]),
      jsonResponse(
        { id: "1", name: "Notebook", description: null },
        { status: 201 },
      ),
      jsonResponse(
        { id: "2", name: "Mouse", description: null },
        { status: 201 },
      ),
    );
    render(<App />);
    await screen.findByText("Nenhum item cadastrado.");

    for (const name of ["Notebook", "Mouse"]) {
      await user.type(screen.getByLabelText("Nome"), name);
      await user.click(screen.getByRole("button", { name: "Adicionar" }));
      await screen.findByText(name);
    }

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("não cadastra item com nome inválido", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(jsonResponse([]));
    render(<App />);
    await screen.findByText("Nenhum item cadastrado.");

    await user.type(screen.getByLabelText("Nome"), "   ");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O nome é obrigatório.",
    );
    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mantém os valores e mostra erro 409 quando o cadastro falha", async () => {
    const user = userEvent.setup();
    stubFetch(jsonResponse([]), {
      ok: false,
      status: 409,
      json: vi
        .fn()
        .mockResolvedValue({ detail: "Já existe um item com esse nome" }),
    });
    render(<App />);
    await screen.findByText("Nenhum item cadastrado.");

    await user.type(screen.getByLabelText("Nome"), "Notebook");
    await user.type(screen.getByLabelText("Descrição"), "14 polegadas");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe um item com esse nome",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("Notebook");
    expect(screen.getByLabelText("Descrição")).toHaveValue("14 polegadas");
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("desabilita o formulário enquanto o cadastro está pendente", async () => {
    const user = userEvent.setup();
    const response = deferred();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockReturnValueOnce(response.promise);
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await screen.findByText("Nenhum item cadastrado.");

    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("status")).toHaveTextContent("Aguarde...");
    expect(screen.getByLabelText("Nome")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Aguarde..." })).toBeDisabled();
    await act(async () => {
      response.resolve(
        jsonResponse(
          { id: "2", name: "Mouse", description: null },
          { status: 201 },
        ),
      );
    });
    expect(await screen.findByText("Mouse")).toBeInTheDocument();
  });

  it("edita um item e preserva os demais itens da lista", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(
      jsonResponse([
        { id: "1", name: "Notebook", description: "14 polegadas" },
        { id: "2", name: "Mouse", description: "Sem fio" },
      ]),
      jsonResponse({
        id: "1",
        name: "Notebook Pro",
        description: "16 polegadas",
      }),
    );
    render(<App />);
    await screen.findByText("Notebook");

    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("Notebook");
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Notebook Pro");
    await user.clear(screen.getByLabelText("Descrição"));
    await user.type(screen.getByLabelText("Descrição"), "16 polegadas");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Notebook Pro")).toBeInTheDocument();
    expect(screen.getByText("16 polegadas")).toBeInTheDocument();
    expect(screen.getByText("Mouse")).toBeInTheDocument();
    expect(screen.getByText("Sem fio")).toBeInTheDocument();
    expect(
      screen.queryByText("Notebook", { exact: true }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Item atualizado com sucesso.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("cancela a edição sem alterar a lista", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(
      jsonResponse([
        { id: "1", name: "Notebook", description: "14 polegadas" },
      ]),
    );
    render(<App />);
    await screen.findByText("Notebook");

    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Alteração descartada");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByText("Notebook")).toBeInTheDocument();
    expect(screen.queryByText("Alteração descartada")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Edição cancelada.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mantém os valores e mostra erro quando a edição falha", async () => {
    const user = userEvent.setup();
    stubFetch(
      jsonResponse([
        { id: "1", name: "Notebook", description: "14 polegadas" },
      ]),
      {
        ok: false,
        status: 409,
        json: vi
          .fn()
          .mockResolvedValue({ detail: "Já existe um item com esse nome" }),
      },
    );
    render(<App />);
    await screen.findByText("Notebook");

    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe um item com esse nome",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("Mouse");
    expect(screen.getByText("Notebook")).toBeInTheDocument();
  });

  it("confirma a remoção e retira somente o item escolhido", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(
      jsonResponse([
        { id: "1", name: "Notebook", description: "14 polegadas" },
        { id: "2", name: "Mouse", description: "Sem fio" },
      ]),
      { ok: true, status: 204 },
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    await screen.findByText("Notebook");

    await user.click(screen.getByRole("button", { name: "Remover Notebook" }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Deseja remover o item "Notebook"?',
    );
    expect(await screen.findByText("Mouse")).toBeInTheDocument();
    expect(
      screen.queryByText("Notebook", { exact: true }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Item removido com sucesso.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("não remove o item quando a confirmação é cancelada", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(
      jsonResponse([
        { id: "1", name: "Notebook", description: "14 polegadas" },
      ]),
    );
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);
    await screen.findByText("Notebook");

    await user.click(screen.getByRole("button", { name: "Remover Notebook" }));

    expect(screen.getByText("Notebook")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mostra erro e mantém o item na lista quando a remoção falha", async () => {
    const user = userEvent.setup();
    stubFetch(
      jsonResponse([
        { id: "1", name: "Notebook", description: "14 polegadas" },
      ]),
      {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ detail: "Falha ao remover" }),
      },
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    await screen.findByText("Notebook");

    await user.click(screen.getByRole("button", { name: "Remover Notebook" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha ao remover",
    );
    expect(screen.getByText("Notebook")).toBeInTheDocument();
  });
});
