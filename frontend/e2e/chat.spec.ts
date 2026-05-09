import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
});

test('user can create a chat and receive a mock assistant response', async ({
  page,
}) => {
  await expect(page.getByText('Диалоги появятся здесь.')).toBeVisible();

  await page.getByRole('button', { name: 'Новый чат' }).click();
  await expect(page.getByText('Напишите первое сообщение')).toBeVisible();

  await page.getByLabel('Сообщение').fill('Привет, ассистент');
  await page.getByRole('button', { name: 'Отправить' }).click();

  await expect(page.getByText('Ассистент отвечает...')).toBeVisible();
  await expect(page.getByText('Привет, ассистент')).toHaveCount(3);
  await expect(
    page.getByText('Mock-ответ ассистента на сообщение: "Привет, ассистент"'),
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: /^Привет, ассистент/ }),
  ).toHaveAttribute('aria-current', 'page');
});
