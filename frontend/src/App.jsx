import clsx from "clsx";

import { useState } from "react";
import { ItemForm } from "./components/ItemForm";
import { ItemList } from "./components/ItemList";

export default function App() {
  const [items, setItems] = useState([]);

  // Na Prática 7, esta função passará a chamar a API (POST /items).
  function addItem({ name, description }) {
    setItems((current) => [
      ...current,
      { id: crypto.randomUUID(), name, description },
    ]);
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
        <ItemForm onAdd={addItem} />
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
          <ItemList items={items} />
        </section>
      </main>
    </div>
  );
}
