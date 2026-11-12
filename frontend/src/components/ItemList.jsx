import clsx from "clsx";

export function ItemList({ items, editingId, onEdit, onRemove }) {
  if (items.length === 0) {
    return (
      <p className="text-sm sm:text-base md:text-lg text-slate-900">
        Nenhum item cadastrado.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li
          key={item.id}
          className={clsx(
            "rounded-lg border-4 border-cyan-600",
            "bg-white p-4 shadow-sm space-y-3",
            "transition-shadow duration-300 hover:shadow-xl",
            editingId === item.id && "ring-2 ring-cyan-900 ring-offset-2",
          )}
        >
          <h3 className="text-base sm:text-lg md:text-xl font-medium break-words">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-sm sm:text-base md:text-lg text-slate-900 whitespace-pre-wrap break-words">
              {item.description}
            </p>
          )}
          {editingId === item.id && (
            <p className="text-sm text-cyan-900">Em edição</p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onEdit(item.id)}
              disabled={editingId === item.id}
              aria-label={`Editar ${item.name}`}
              className={clsx(
                "rounded bg-cyan-600",
                "px-4 py-2",
                "font-medium text-white",
                "cursor-pointer",
                "hover:bg-cyan-700 focus:outline-2 focus:outline-offset-2 focus:outline-cyan-600",
                "disabled:opacity-60 disabled:cursor-default",
              )}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Remover ${item.name}`}
              className={clsx(
                "rounded bg-red-700",
                "px-4 py-2",
                "font-medium text-white",
                "cursor-pointer",
                "hover:bg-red-800 focus:outline-2 focus:outline-offset-2 focus:outline-red-700",
              )}
            >
              Remover
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
