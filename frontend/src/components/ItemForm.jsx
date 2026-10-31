import clsx from "clsx";

import { useState } from "react";
import { validateItem } from "../validation";

export function ItemForm({ onAdd }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateItem({ name, description });
    setErrors(result.errors);
    if (Object.keys(result.errors).length > 0) return;

    onAdd(result.values);
    setName("");
    setDescription("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={clsx(
        "rounded-lg border-4 border-cyan-600",
        "bg-white shadow-lg",
        "space-y-4 p-4",
      )}
    >
      <div className="space-y-1">
        <label
          htmlFor="item-name"
          className={clsx(
            "block font-medium",
            "text-base sm:text-lg md:text-xl lg:text-2xl",
          )}
        >
          Nome
        </label>
        <input
          id="item-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={errors.name ? "item-name-error" : undefined}
          className={clsx(
            "w-full p-2",
            "rounded border-2 border-slate-300",
            "text-sm sm:text-base md:text-lg lg:text-xl",
          )}
        />
        {errors.name && (
          <p
            id="item-name-error"
            role="alert"
            className="text-sm sm:text-base md:text-lg text-red-700"
          >
            {errors.name}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label
          htmlFor="item-description"
          className={clsx(
            "block font-medium",
            "text-base sm:text-lg md:text-xl lg:text-2xl",
          )}
        >
          Descrição
        </label>
        <textarea
          id="item-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className={clsx(
            "w-full p-2",
            "rounded border-2 border-slate-300",
            "text-sm sm:text-base md:text-lg lg:text-xl",
          )}
        />
      </div>
      <button
        type="submit"
        className={clsx(
          "w-full",
          "rounded bg-cyan-600",
          "text-base sm:text-lg md:text-xl lg:text-2xl",
          "font-medium text-white",
          "px-4 py-2",
          "transition-all duration-300",
          "hover:bg-cyan-700 active:bg-cyan-700",
          "focus:outline-2 focus:outline-offset-2",
          "focus:outline-cyan-600 active:outline-cyan-600",
          "cursor-pointer",
        )}
      >
        Adicionar
      </button>
    </form>
  );
}
