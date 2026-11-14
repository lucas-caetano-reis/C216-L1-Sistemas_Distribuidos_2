import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemForm } from "../../src/components/ItemForm";

describe("ItemForm", () => {
  it("renderiza os campos de formulário e o botão", () => {
    render(<ItemForm onAdd={() => {}} />);
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Adicionar" }),
    ).toBeInTheDocument();
  });

  it("chama onAdd com os valores e limpa o formulário", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ItemForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Nome"), "Notebook");
    await user.type(screen.getByLabelText("Descrição"), "14 polegadas");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onAdd).toHaveBeenCalledWith({
      name: "Notebook",
      description: "14 polegadas",
    });
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("mostra erro e não chama onAdd com nome vazio", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ItemForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O nome é obrigatório.",
    );
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("preenche os campos e mostra as opções de edição", () => {
    const item = { id: "1", name: "Notebook", description: "14 polegadas" };
    render(<ItemForm item={item} onUpdate={() => {}} onCancel={() => {}} />);

    expect(screen.getByLabelText("Nome")).toHaveValue("Notebook");
    expect(screen.getByLabelText("Descrição")).toHaveValue("14 polegadas");
    expect(
      screen.getByRole("button", { name: "Salvar alterações" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancelar" }),
    ).toBeInTheDocument();
  });

  it("chama onUpdate com os valores alterados e limpa o formulário", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const onAdd = vi.fn();
    const item = { id: "1", name: "Notebook", description: "14 polegadas" };
    render(<ItemForm item={item} onUpdate={onUpdate} onAdd={onAdd} />);

    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Notebook Pro");
    await user.clear(screen.getByLabelText("Descrição"));
    await user.type(screen.getByLabelText("Descrição"), "16 polegadas");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onUpdate).toHaveBeenCalledWith({
      name: "Notebook Pro",
      description: "16 polegadas",
    });
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
  });

  it("chama onCancel ao cancelar a edição", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const item = { id: "1", name: "Notebook", description: "14 polegadas" };
    render(<ItemForm item={item} onUpdate={() => {}} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("mostra erro da API e preserva os valores digitados", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockRejectedValue(new Error("Nome duplicado"));
    const item = { id: "1", name: "Notebook", description: "14 polegadas" };
    render(<ItemForm item={item} onUpdate={onUpdate} />);

    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nome duplicado",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("Mouse");
    expect(screen.getByLabelText("Descrição")).toHaveValue("14 polegadas");
  });

  it("desabilita os campos e impede o envio quando disabled for True", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ItemForm onAdd={onAdd} disabled />);

    expect(screen.getByLabelText("Nome")).toBeDisabled();
    expect(screen.getByLabelText("Descrição")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("mostra estado de salvamento enquanto saving for True", () => {
    render(<ItemForm onAdd={() => {}} saving />);

    expect(
      screen.getByRole("button", { name: "Aguarde..." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aguarde...").closest("form")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});
