import { expect, test } from "@playwright/test";

function uniqueName(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createItem(page, name, description = "") {
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Descrição").fill(description);
  await page.getByRole("button", { name: "Adicionar" }).click();

  const item = page.getByRole("listitem").filter({ hasText: name });
  await expect(item).toBeVisible();
  return item;
}

async function removeItem(page, item, name) {
  page.once("dialog", (dialog) => dialog.accept());
  await item.getByRole("button", { name: `Remover ${name}` }).click();
  await expect(item).toHaveCount(0);
}

test("cadastra um item e ele persiste após recarregar a página", async ({
  page,
}) => {
  const name = uniqueName("Notebook");

  await page.goto("/");
  let item = await createItem(page, name, "14 polegadas");
  await expect(item).toContainText("14 polegadas");

  await page.reload();
  item = page.getByRole("listitem").filter({ hasText: name });
  await expect(item).toBeVisible();
  await expect(item).toContainText("14 polegadas");

  await removeItem(page, item, name);
});

test("edita um item e mantém as alterações após recarregar a página", async ({
  page,
}) => {
  const name = uniqueName("Notebook");
  const updatedName = `${name}-Pro`;

  await page.goto("/");
  let item = await createItem(page, name, "14 polegadas");

  await item.getByRole("button", { name: `Editar ${name}` }).click();
  await expect(page.getByLabel("Nome")).toHaveValue(name);
  await page.getByLabel("Nome").fill(updatedName);
  await page.getByLabel("Descrição").fill("16 polegadas");
  await page.getByRole("button", { name: "Salvar alterações" }).click();

  item = page.getByRole("listitem").filter({ hasText: updatedName });
  await expect(item).toBeVisible();
  await expect(item).toContainText("16 polegadas");

  await page.reload();
  item = page.getByRole("listitem").filter({ hasText: updatedName });
  await expect(item).toBeVisible();
  await expect(item).toContainText("16 polegadas");

  await removeItem(page, item, updatedName);
});

test("remove um item e ele continua ausente após recarregar a página", async ({
  page,
}) => {
  const name = uniqueName("Mouse");

  await page.goto("/");
  const item = await createItem(page, name);

  page.once("dialog", (dialog) => dialog.accept());
  await item.getByRole("button", { name: `Remover ${name}` }).click();
  await expect(item).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByRole("listitem").filter({ hasText: name }),
  ).toHaveCount(0);
});

test("exibe o erro da API ao tentar cadastrar nome duplicado", async ({
  page,
}) => {
  const name = uniqueName("Mouse");

  await page.goto("/");
  const item = await createItem(page, name);

  await page.getByLabel("Nome").fill(name);
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Já existe um item com esse nome",
  );
  await expect(page.getByLabel("Nome")).toHaveValue(name);
  await expect(item).toBeVisible();

  await removeItem(page, item, name);
});

test("não envia o cadastro quando o nome está vazio ou só tem espaços", async ({
  page,
}) => {
  const postRequests = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/items/"
    ) {
      postRequests.push(request);
    }
  });

  const listResponse = page.waitForResponse((response) => {
    const request = response.request();
    return (
      request.method() === "GET" &&
      new URL(response.url()).pathname === "/items/"
    );
  });
  await page.goto("/");
  expect((await listResponse).ok()).toBeTruthy();

  for (const name of ["", "   "]) {
    await page.getByLabel("Nome").fill(name);
    await page.getByRole("button", { name: "Adicionar" }).click();

    await expect(page.getByRole("alert")).toHaveText("O nome é obrigatório.");
  }

  expect(postRequests).toHaveLength(0);
});
