import { describe, expect, it } from "vitest";
import { NAME_MAX_LENGTH, validateItem } from "../../src/validation";

const items = [
  { id: "1", name: "Notebook", description: "" },
  { id: "2", name: "Mouse", description: "" },
];

describe("validateItem", () => {
  it("aceita nome preenchido e descrição vazia", () => {
    const { errors, values } = validateItem({
      name: "Notebook",
      description: "",
    });
    expect(errors).toEqual({});
    expect(values).toEqual({ name: "Notebook", description: "" });
  });

  it("remove espaços nas extremidades", () => {
    const { values } = validateItem({
      name: "  Mouse ",
      description: " sem fio ",
    });
    expect(values).toEqual({ name: "Mouse", description: "sem fio" });
  });

  it.each(["", "   "])("rejeita nome vazio (%s)", (name) => {
    expect(validateItem({ name, description: "" }).errors.name).toBe(
      "O nome é obrigatório.",
    );
  });

  it("rejeita nome acima do limite de caracteres", () => {
    const name = "a".repeat(NAME_MAX_LENGTH + 1);
    expect(validateItem({ name, description: "" }).errors.name).toBe(
      `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres`,
    );
  });

  it("rejeita nome duplicado na criação, mesmo com espaços extras", () => {
    const result = validateItem({ name: "  Mouse  ", description: "" }, items);
    expect(result.errors.name).toBe("Já existe um item com esse nome.");
  });

  it("permite manter o nome do próprio item na edição", () => {
    const result = validateItem(
      { name: "Notebook", description: "Nova" },
      items,
      "1",
    );
    expect(result.errors).toEqual({});
  });

  it("rejeita o nome de outro item na edição", () => {
    const result = validateItem({ name: "Mouse", description: "" }, items, "1");
    expect(result.errors.name).toBe("Já existe um item com esse nome.");
  });

  it("permite renomear para um nome disponível", () => {
    expect(
      validateItem({ name: "Monitor", description: "" }, items, "1").errors,
    ).toEqual({});
  });
});
