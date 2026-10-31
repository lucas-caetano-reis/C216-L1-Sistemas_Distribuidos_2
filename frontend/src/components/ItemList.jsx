import clsx from "clsx";

export function ItemList({ items }) {
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
            "bg-white p-4 shadow-sm",
            "transition-all durantion-300",
            "hover:border-cyan-700 active:border-cyan-700",
            "hover:shadow-xl active:shadow-xl",
            "hover:scale-101 active:scale-101",
            "hover:-translate-y-1 active:-translate-y-1",
            "cursor-pointer",
          )}
        >
          <span className="text-base sm:text-lg md:text-xl font-medium">
            {item.name}
          </span>
          {item.description && (
            <p className="text-sm sm:text-base md:text-lg text-slate-900">
              {item.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
