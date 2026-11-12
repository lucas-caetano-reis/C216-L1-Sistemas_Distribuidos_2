import { expect, test } from "@playwright/test";

async function addItem(page, name, description = "") {
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Descrição").fill(description);
  await page.getByRole("button", { name: "Adicionar" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("carrega a interface com a lista vazia", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Gerenciador de Itens" }),
  ).toBeVisible();
  await expect(page.getByText("Nenhum item cadastrado.")).toBeVisible();
});

test("cadastra um item e o exibe na listagem", async ({ page }) => {
  await addItem(page, "Notebook", "14 polegadas");
  await expect(page.getByRole("listitem")).toContainText("Notebook");
  await expect(page.getByText("14 polegadas")).toBeVisible();
  await expect(page.getByText("Nenhum item cadastrado.")).toBeHidden();
});

test("não cadastra item sem nome", async ({ page }) => {
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("alert")).toHaveText("O nome é obrigatório.");
  await expect(page.getByText("Nenhum item cadastrado.")).toBeVisible();
});

test("edita um item, preserva os demais e volta ao cadastro", async ({
  page,
}) => {
  await addItem(page, "Notebook", "14 polegadas");
  await addItem(page, "Mouse", "Sem fio");
  await page.getByRole("button", { name: "Editar Notebook" }).click();
  await expect(page.getByLabel("Nome")).toHaveValue("Notebook");
  await expect(page.getByLabel("Descrição")).toHaveValue("14 polegadas");
  await expect(page.getByLabel("Nome")).toBeFocused();
  await page.getByLabel("Nome").fill("Monitor");
  await page.getByLabel("Descrição").fill("27 polegadas");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(2);
  await expect(page.getByRole("listitem").nth(0)).toContainText("Monitor");
  await expect(page.getByRole("listitem").nth(0)).toContainText("27 polegadas");
  await expect(page.getByRole("listitem").nth(1)).toContainText("Mouse");
  await expect(page.getByRole("listitem").nth(1)).toContainText("Sem fio");
  await expect(
    page.getByRole("heading", { name: "Notebook", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText(
    "Item atualizado com sucesso.",
  );
  await expect(page.getByRole("form", { name: "Novo item" })).toBeVisible();
  await expect(page.getByLabel("Nome")).toBeEmpty();
  await addItem(page, "Teclado");
  await expect(page.getByRole("listitem")).toHaveCount(3);
});

test("cancela a edição sem modificar o item", async ({ page }) => {
  await addItem(page, "Notebook", "Original");
  await page.getByRole("button", { name: "Editar Notebook" }).click();
  await page.getByLabel("Nome").fill("Rascunho");
  await page.getByLabel("Descrição").fill("Alterada");
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("listitem")).toContainText("Notebook");
  await expect(page.getByRole("listitem")).toContainText("Original");
  await expect(page.getByRole("listitem")).not.toContainText("Rascunho");
  await expect(page.getByLabel("Nome")).toBeEmpty();
  await page.getByRole("button", { name: "Editar Notebook" }).click();
  await expect(page.getByLabel("Nome")).toHaveValue("Notebook");
  await expect(page.getByLabel("Descrição")).toHaveValue("Original");
});

test("rejeita nome vazio na edição e permite manter o próprio nome sem descrição", async ({
  page,
}) => {
  await addItem(page, "Notebook", "Original");
  await page.getByRole("button", { name: "Editar Notebook" }).click();
  await page.getByLabel("Nome").fill("");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("alert")).toHaveText("O nome é obrigatório.");
  await expect(page.getByRole("listitem")).toContainText("Notebook");
  await page.getByLabel("Nome").fill("Notebook");
  await page.getByLabel("Descrição").fill("");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Notebook", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Original", { exact: true })).toHaveCount(0);
});

test("rejeita nomes duplicados na criação e na edição", async ({ page }) => {
  await addItem(page, "Notebook");
  await addItem(page, "Mouse");
  await addItem(page, "  Mouse  ");
  await expect(page.getByRole("alert")).toHaveText(
    "Já existe um item com esse nome.",
  );
  await expect(page.getByRole("listitem")).toHaveCount(2);
  await page.getByRole("button", { name: "Editar Notebook" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByLabel("Nome").fill("Mouse");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Já existe um item com esse nome.",
  );
  await expect(
    page.getByRole("heading", { name: "Notebook", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Nome").fill("Monitor");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Monitor", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(2);
});

test("confirma a remoção somente do item selecionado", async ({ page }) => {
  await addItem(page, "Notebook");
  await addItem(page, "Mouse");
  const dialogPromise = page.waitForEvent("dialog");
  const clickPromise = page
    .getByRole("button", { name: "Remover Notebook" })
    .click();
  const dialog = await dialogPromise;
  const type = dialog.type();
  const message = dialog.message();
  await dialog.accept();
  await clickPromise;
  expect(type).toBe("confirm");
  expect(message).toBe('Deseja remover o item "Notebook"?');
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("listitem")).toContainText("Mouse");
  await expect(page.getByRole("status")).toHaveText(
    "Item removido com sucesso.",
  );
  await addItem(page, "Notebook");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("listitem")).toHaveCount(2);
});

test("desiste da remoção e preserva o item e a edição", async ({ page }) => {
  await addItem(page, "Notebook");
  await page.getByRole("button", { name: "Editar Notebook" }).click();
  await page.getByLabel("Nome").fill("Rascunho");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Remover Notebook" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("listitem")).toContainText("Notebook");
  await expect(page.getByLabel("Nome")).toHaveValue("Rascunho");
  await expect(
    page.getByRole("button", { name: "Salvar alterações" }),
  ).toBeVisible();
});

test("remove o item em edição e permite criar após esvaziar a lista", async ({
  page,
}) => {
  await addItem(page, "Notebook");
  await page.getByRole("button", { name: "Editar Notebook" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remover Notebook" }).click();
  await expect(page.getByText("Nenhum item cadastrado.")).toBeVisible();
  await expect(page.getByRole("form", { name: "Novo item" })).toBeVisible();
  await expect(page.getByLabel("Nome")).toBeEmpty();
  await expect(page.getByRole("button", { name: "Cancelar" })).toHaveCount(0);
  await addItem(page, "Mouse");
  await expect(page.getByRole("listitem")).toContainText("Mouse");
});
