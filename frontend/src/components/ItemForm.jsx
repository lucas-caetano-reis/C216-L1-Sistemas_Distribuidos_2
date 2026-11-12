import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export function ItemForm({ item, onSave, onCancel }) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [errors, setErrors] = useState({});
  const nameInput = useRef(null);
  const isEditing = Boolean(item);

  useEffect(() => {
    if (isEditing) nameInput.current?.focus();
  }, [isEditing]);

  function handleSubmit(event) {
    event.preventDefault();
    const saveErrors = onSave({ name, description });
    setErrors(saveErrors);
    if (Object.keys(saveErrors).length > 0) {
      if (saveErrors.name) nameInput.current?.focus();
      return;
    }

    setName("");
    setDescription("");
    nameInput.current?.focus();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="item-form-heading"
      className={clsx(
        "rounded-lg border-4 border-cyan-600",
        "bg-white shadow-lg",
        "space-y-4 p-4",
      )}
    >
      <h2 id="item-form-heading" className="text-lg sm:text-xl font-semibold">
        {isEditing ? "Editar item" : "Novo item"}
      </h2>
      {errors.form && (
        <p role="alert" className="text-sm text-red-700">
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
          ref={nameInput}
          id="item-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(errors.name)}
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
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className={clsx(
            "flex-1 rounded bg-cyan-600",
            "text-base sm:text-lg md:text-xl lg:text-2xl",
            "font-medium text-white px-4 py-2",
            "transition-colors duration-300",
            "hover:bg-cyan-700 active:bg-cyan-700",
            "focus:outline-2 focus:outline-offset-2 focus:outline-cyan-600",
            "cursor-pointer",
          )}
        >
          {isEditing ? "Salvar alterações" : "Adicionar"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className={clsx(
              "rounded border-2 border-slate-400",
              "px-4 py-2",
              "font-medium",
              "cursor-pointer",
              "hover:bg-slate-100 focus:outline-2 focus:outline-offset-2 focus:outline-slate-600",
            )}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
