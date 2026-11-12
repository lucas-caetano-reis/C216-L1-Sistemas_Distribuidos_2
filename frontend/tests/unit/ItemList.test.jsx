import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemList } from "../../src/components/ItemList";

const items = [
  { id: "1", name: "Notebook", description: "14 polegadas" },
  { id: "2", name: "Mouse", description: "" },
];

describe("ItemList", () => {
  it("exibe mensagem quando a lista está vazia", () => {
    render(<ItemList items={[]} />);
    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("exibe nome, descrição e ações dos itens", () => {
    render(<ItemList items={items} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Notebook" }),
    ).toBeInTheDocument();
    expect(screen.getByText("14 polegadas")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mouse" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Editar Notebook" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Remover Mouse" })).toBeEnabled();
  });

  it("encaminha o id correto para cada ação", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    render(<ItemList items={items} onEdit={onEdit} onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: "Editar Mouse" }));
    expect(onEdit).toHaveBeenCalledExactlyOnceWith("2");
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remover Notebook" }));
    expect(onRemove).toHaveBeenCalledExactlyOnceWith("1");
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("indica o item em edição e permite editar outro ou remover o atual", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    render(
      <ItemList
        items={items}
        editingId="1"
        onEdit={onEdit}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText("Em edição")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Editar Notebook" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Editar Notebook" }));
    expect(onEdit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Editar Mouse" }));
    expect(onEdit).toHaveBeenCalledExactlyOnceWith("2");
    await user.click(screen.getByRole("button", { name: "Remover Notebook" }));
    expect(onRemove).toHaveBeenCalledExactlyOnceWith("1");
  });
});
