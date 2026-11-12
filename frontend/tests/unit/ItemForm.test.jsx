import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemForm } from "../../src/components/ItemForm";

const item = { id: "1", name: "Notebook", description: "14 polegadas" };

describe("ItemForm", () => {
  it("renderiza o formulário de criação vazio", () => {
    render(<ItemForm onSave={vi.fn()} />);
    expect(screen.getByRole("form", { name: "Novo item" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Cancelar" }),
    ).not.toBeInTheDocument();
  });

  it("envia os campos para onSave e os limpa após a criação do item", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockReturnValue({});
    render(<ItemForm onSave={onSave} />);
    await user.type(screen.getByLabelText("Nome"), item.name);
    await user.type(screen.getByLabelText("Descrição"), item.description);
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(onSave).toHaveBeenCalledExactlyOnceWith({
      name: item.name,
      description: item.description,
    });
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
    expect(screen.getByLabelText("Nome")).toHaveFocus();
  });

  it("preenche os dados e foca o nome ao iniciar a edição", () => {
    render(<ItemForm item={item} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(
      screen.getByRole("form", { name: "Editar item" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue(item.name);
    expect(screen.getByLabelText("Descrição")).toHaveValue(item.description);
    expect(screen.getByLabelText("Nome")).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "Salvar alterações" }),
    ).toBeEnabled();
  });

  it("aceita editar um item sem descrição", () => {
    render(<ItemForm item={{ ...item, description: null }} onSave={vi.fn()} />);
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
  });

  it("envia os valores alterados ao salvar uma edição", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockReturnValue({});
    render(<ItemForm item={item} onSave={onSave} />);
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Monitor");
    await user.clear(screen.getByLabelText("Descrição"));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(onSave).toHaveBeenCalledExactlyOnceWith({
      name: "Monitor",
      description: "",
    });
  });

  it("cancela sem submeter o formulário", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<ItemForm item={item} onSave={onSave} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("mantém os dados e associa o erro ao nome quando o salvamento falha", async () => {
    const user = userEvent.setup();
    const error = "Já existe um item com esse nome.";
    const onSave = vi.fn().mockReturnValue({ name: error });
    render(<ItemForm item={item} onSave={onSave} />);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(screen.getByRole("alert")).toHaveTextContent(error);
    expect(screen.getByLabelText("Nome")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Nome")).toHaveAccessibleDescription(error);
    expect(screen.getByLabelText("Nome")).toHaveFocus();
    expect(screen.getByLabelText("Nome")).toHaveValue(item.name);
    expect(screen.getByLabelText("Descrição")).toHaveValue(item.description);
  });

  it("remove o erro quando uma nova tentativa tem sucesso", async () => {
    const user = userEvent.setup();
    const onSave = vi
      .fn()
      .mockReturnValueOnce({ name: "O nome é obrigatório." })
      .mockReturnValueOnce({});
    render(<ItemForm onSave={onSave} />);
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });

  it("exibe erros gerais sem apagar os campos", async () => {
    const user = userEvent.setup();
    render(
      <ItemForm
        item={item}
        onSave={() => ({ form: "Item não encontrado." })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Item não encontrado.");
    expect(screen.getByLabelText("Nome")).toHaveValue(item.name);
  });
});
