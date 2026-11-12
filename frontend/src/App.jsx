import clsx from "clsx";

import { useEffect, useState } from "react";
import { ItemForm } from "./components/ItemForm";
import { ItemList } from "./components/ItemList";
import {
  createItem,
  deleteItem,
  listItems,
  updateItem,
} from "./services/items";

export default function App() {
  const [items, setItems] = useState([]);

  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const disabled = loading || saving || loadError !== "";

  // loading também permite repetir a consulta após um erro.
  useEffect(() => {
    if (!loading) return;
    let active = true;

    async function loadItems() {
      setLoadError("");
      try {
        const data = await listItems();
        if (active) setItems(data);
      } catch (error) {
        if (active) setLoadError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadItems();
    return () => {
      active = false;
    };
  }, [loading]);

  async function addItem({ name, description }) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const created = await createItem({ name, description });
      setItems((current) => [...current, created]);
      setMessage("Item adicionado com sucesso.");
    } finally {
      setSaving(false);
    }
  }

  async function editItem({ name, description }) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateItem(editingItem.id, { name, description });
      // map substitui apenas o item editado, mantendo os demais.
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditingItem(null);
      setMessage("Item atualizado com sucesso.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item) {
    setEditingItem(item);
    setError("");
    setMessage("");
  }

  function cancelEditing() {
    setEditingItem(null);
    setMessage("Edição cancelada.");
  }

  async function removeItem(item) {
    if (!window.confirm(`Deseja remover o item "${item.name}"?`)) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await deleteItem(item.id);
      // filter mantém todos os itens, exceto o removido.
      setItems((current) =>
        current.filter((currentItem) => currentItem.id !== item.id),
      );
      if (editingItem?.id === item.id) setEditingItem(null);
      setMessage("Item removido com sucesso.");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
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
          key={editingItem?.id ?? "new"}
          item={editingItem}
          onAdd={addItem}
          onUpdate={editItem}
          onCancel={cancelEditing}
          disabled={disabled}
          saving={saving}
        />
        <p role="status">{saving ? "Aguarde..." : message}</p>
        {error && (
          <p role="alert" className="text-red-800">
            {error}
          </p>
        )}
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
          {loading && <p>Carregando itens...</p>}
          {loadError && (
            <div className="space-y-2">
              <p role="alert" className="text-red-800">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => setLoading(true)}
                disabled={loading}
                className="rounded bg-cyan-700 px-4 py-2 text-white cursor-pointer disabled:opacity-60"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {!loading && !loadError && (
            <ItemList
              items={items}
              onEdit={startEditing}
              onRemove={removeItem}
              disabled={disabled}
            />
          )}
        </section>
      </main>
    </div>
  );
}
