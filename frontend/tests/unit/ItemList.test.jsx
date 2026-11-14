import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemList } from "../../src/components/ItemList";

describe("ItemList", () => {
  it("exibe mensagem quando a lista está vazia", () => {
    render(<ItemList items={[]} />);
    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
  });

  it("exibe nome e descrição dos itens", () => {
    const items = [
      { id: "1", name: "Notebook", description: "14 polegadas" },
      { id: "2", name: "Mouse", description: "" },
    ];
    render(<ItemList items={items} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Notebook")).toBeInTheDocument();
    expect(screen.getByText("14 polegadas")).toBeInTheDocument();
    expect(screen.getByText("Mouse")).toBeInTheDocument();
  });

  it("chama onEdit e onRemove com o item selecionado", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    const item = { id: "1", name: "Notebook", description: "14 polegadas" };
    render(<ItemList items={[item]} onEdit={onEdit} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    await user.click(screen.getByRole("button", { name: "Remover Notebook" }));

    expect(onEdit).toHaveBeenCalledWith(item);
    expect(onRemove).toHaveBeenCalledWith(item);
  });

  it("desabilita as opções enquanto disabled for True", () => {
    const item = { id: "1", name: "Notebook", description: "14 polegadas" };
    render(<ItemList items={[item]} disabled />);

    expect(
      screen.getByRole("button", { name: "Editar Notebook" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remover Notebook" }),
    ).toBeDisabled();
  });
});
