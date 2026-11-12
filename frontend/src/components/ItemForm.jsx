import clsx from "clsx";

import { useState } from "react";
import { validateItem } from "../validation";

export function ItemForm({
  onAdd,
  onUpdate,
  onCancel,
  item,
  disabled = false,
  saving = false,
}) {
  const [name, setName] = useState(item ? item.name : "");
  const [description, setDescription] = useState(
    item ? item.description || "" : "",
  );
  const [errors, setErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    if (disabled) return;
    const result = validateItem({ name, description });
    setErrors(result.errors);
    if (Object.keys(result.errors).length > 0) return;

    try {
      if (item) {
        await onUpdate(result.values);
      } else {
        await onAdd(result.values);
      }
      setName("");
      setDescription("");
    } catch (error) {
      // Em caso de erro, os campos continuam preenchidos.
      setErrors({ form: error.message });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={saving}
      className={clsx(
        "rounded-lg border-4 border-cyan-600",
        "bg-white shadow-lg",
        "space-y-4 p-4",
      )}
    >
      {item && <h2 className="font-semibold">Editar item</h2>}
      {errors.form && (
        <p role="alert" className="text-red-700">
          {errors.form}
        </p>
      )}
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
          disabled={disabled}
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
          disabled={disabled}
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
        disabled={disabled}
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
          "cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        {saving ? "Aguarde..." : item ? "Salvar alterações" : "Adicionar"}
      </button>
      {item && (
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className={clsx(
            "w-full rounded border-2 border-slate-400",
            "px-4 py-2",
            "cursor-pointer disabled:opacity-60",
          )}
        >
          Cancelar
        </button>
      )}
    </form>
  );
}
