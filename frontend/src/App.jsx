import clsx from "clsx";
import { useState } from "react";
import { ItemForm } from "./components/ItemForm";
import { ItemList } from "./components/ItemList";
import { validateItem } from "./validation";

export default function App() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const editingItem = items.find((item) => item.id === editingId);

  // Na Prática 7, esta função passará a chamar a API (POST /items).
  function saveItem(values) {
    const result = validateItem(values, items, editingId);
    if (Object.keys(result.errors).length > 0) return result.errors;

    if (editingId !== null) {
      if (!editingItem) return { form: "Item não encontrado." };
      setItems((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, ...result.values } : item,
        ),
      );
      setEditingId(null);
      setMessage("Item atualizado com sucesso.");
    } else {
      const newItem = { id: crypto.randomUUID(), ...result.values };
      setItems((current) => [...current, newItem]);
      setMessage("Item adicionado com sucesso.");
    }
    return {};
  }

  function editItem(id) {
    setEditingId(id);
    setMessage("");
  }

  function cancelEditing() {
    setEditingId(null);
    setMessage("Edição cancelada.");
  }

  function removeItem(id) {
    const item = items.find((current) => current.id === id);
    if (!item) {
      setMessage("Item não encontrado.");
      return;
    }
    if (!window.confirm(`Deseja remover o item "${item.name}"?`)) return;

    setItems((current) =>
      current.filter((currentItem) => currentItem.id !== id),
    );
    if (editingId === id) setEditingId(null);
    setMessage("Item removido com sucesso.");
  }

  return (
    <div
      className={clsx(
        "bg-linear-to-b from-emerald-500 to-teal-500",
        "min-h-screen max-w-screen",
      )}
    >
      <main
        className={clsx(
          "flex flex-col mx-auto",
          "max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl space-y-6 p-4 sm:p-6",
        )}
      >
        <h1
          className={clsx(
            "text-2xl sm:text-3xl md:text-4xl",
            "text-center font-bold",
          )}
        >
          Gerenciador de Itens
        </h1>
        <ItemForm
          key={editingId ?? "create"}
          item={editingItem}
          onSave={saveItem}
          onCancel={cancelEditing}
        />
        <p role="status" className="text-sm sm:text-base text-slate-900">
          {message}
        </p>
        <section aria-labelledby="items-heading" className="space-y-3">
          <h2
            id="items-heading"
            className={clsx(
              "font-semibold",
              "text-base sm:text-lg md:text-xl lg:text-2xl",
            )}
          >
            Itens cadastrados
          </h2>
          <ItemList
            items={items}
            editingId={editingId}
            onEdit={editItem}
            onRemove={removeItem}
          />
        </section>
      </main>
    </div>
  );
}
