import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import { NAME_MAX_LENGTH } from "../../src/validation";

async function addItem(user, name, description = "") {
  await user.type(screen.getByLabelText("Nome"), name);
  if (description)
    await user.type(screen.getByLabelText("Descrição"), description);
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
}

async function replaceName(user, name) {
  await user.clear(screen.getByLabelText("Nome"));
  if (name) await user.type(screen.getByLabelText("Nome"), name);
}

afterEach(() => vi.restoreAllMocks());

describe("App", () => {
  it("começa com a lista vazia", () => {
    render(<App />);
    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
  });

  it("cadastra vários itens e limpa o formulário", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addItem(user, "Notebook", "14 polegadas");
    await addItem(user, "Mouse");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("14 polegadas")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mouse", exact: true }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
  });

  it.each(["   ", "a".repeat(NAME_MAX_LENGTH + 1)])(
    "não cadastra nome inválido (%s)",
    async (name) => {
      const user = userEvent.setup();
      render(<App />);
      await addItem(user, name);
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
    },
  );

  it("rejeita criação duplicada após remover espaços das extremidades", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addItem(user, "Mouse");
    await addItem(user, "  Mouse  ");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Já existe um item com esse nome.",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("edita nome e descrição somente do item escolhido e permite novo cadastro", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addItem(user, "Notebook", "14 polegadas");
    await addItem(user, "Mouse", "Sem fio");
    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("Notebook");
    expect(screen.getByLabelText("Descrição")).toHaveValue("14 polegadas");
    await replaceName(user, "  Monitor  ");
    await user.clear(screen.getByLabelText("Descrição"));
    await user.type(screen.getByLabelText("Descrição"), "  27 polegadas  ");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Item atualizado com sucesso.",
    );
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByRole("heading")).toHaveTextContent(/^Monitor$/);
    expect(within(rows[0]).getByText("27 polegadas")).toBeInTheDocument();
    expect(within(rows[1]).getByRole("heading")).toHaveTextContent(/^Mouse$/);
    expect(within(rows[1]).getByText("Sem fio")).toBeInTheDocument();
    expect(screen.queryByText("14 polegadas")).not.toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Novo item" })).toBeInTheDocument();
    await addItem(user, "Teclado");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("mantém o próprio nome e permite apagar a descrição", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addItem(user, "Notebook", "14 polegadas");
    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    await user.clear(screen.getByLabelText("Descrição"));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Notebook", exact: true }),
    ).toBeInTheDocument();
    expect(screen.queryByText("14 polegadas")).not.toBeInTheDocument();
  });

  it("rejeita renomear para outro item e permite corrigir o erro", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addItem(user, "Notebook");
    await addItem(user, "Mouse");
    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    await replaceName(user, "Mouse");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Já existe um item com esse nome.",
    );
    expect(
      screen.getByRole("heading", { name: "Notebook", exact: true }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Mouse");
    await replaceName(user, "Monitor");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Monitor", exact: true }),
    ).toBeInTheDocument();
  });

  it.each(["", "a".repeat(NAME_MAX_LENGTH + 1)])(
    "preserva o item ao tentar editar com nome inválido (%s)",
    async (name) => {
      const user = userEvent.setup();
      render(<App />);
      await addItem(user, "Notebook", "Original");
      await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
      await replaceName(user, name);
      await user.click(
        screen.getByRole("button", { name: "Salvar alterações" }),
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("listitem")).toHaveTextContent("Notebook");
      expect(screen.getByRole("listitem")).toHaveTextContent("Original");
    },
  );

  it("cancela a edição e descarta as alterações", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addItem(user, "Notebook", "Original");
    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    await replaceName(user, "Rascunho");
    await user.clear(screen.getByLabelText("Descrição"));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("listitem")).toHaveTextContent("Notebook");
    expect(screen.getByRole("listitem")).toHaveTextContent("Original");
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent("Edição cancelada.");
    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("Notebook");
    expect(screen.getByLabelText("Descrição")).toHaveValue("Original");
  });

  it("carrega o novo item ao trocar de edição e limpa erros anteriores", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addItem(user, "Notebook", "14 polegadas");
    await addItem(user, "Mouse", "Sem fio");
    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    await replaceName(user, "");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Editar Mouse" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("Mouse");
    expect(screen.getByLabelText("Descrição")).toHaveValue("Sem fio");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("remove somente o item confirmado e permite reutilizar seu nome", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    await addItem(user, "Notebook");
    await addItem(user, "Mouse");
    await user.click(screen.getByRole("button", { name: "Remover Notebook" }));
    expect(confirm).toHaveBeenCalledExactlyOnceWith(
      'Deseja remover o item "Notebook"?',
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("Mouse");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Item removido com sucesso.",
    );
    await addItem(user, "Notebook");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("preserva o item e o rascunho ao desistir da remoção", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);
    await addItem(user, "Notebook");
    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    await replaceName(user, "Rascunho");
    await user.click(screen.getByRole("button", { name: "Remover Notebook" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByRole("listitem")).toHaveTextContent("Notebook");
    expect(screen.getByLabelText("Nome")).toHaveValue("Rascunho");
    expect(
      screen.getByRole("button", { name: "Salvar alterações" }),
    ).toBeInTheDocument();
  });

  it("encerra a edição ao remover o próprio item e retorna à lista vazia", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    await addItem(user, "Notebook");
    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    await user.click(screen.getByRole("button", { name: "Remover Notebook" }));
    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Novo item" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: "Cancelar" }),
    ).not.toBeInTheDocument();
    await addItem(user, "Mouse");
    expect(screen.getByRole("listitem")).toHaveTextContent("Mouse");
  });

  it("preserva a edição quando outro item é removido", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    await addItem(user, "Notebook");
    await addItem(user, "Mouse");
    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    await replaceName(user, "Monitor");
    await user.click(screen.getByRole("button", { name: "Remover Mouse" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("Monitor");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("Monitor");
  });
});
