import type { Page } from '@playwright/test';
export const ROUTES = [
  '/', '/help/', '/plan/', '/under-18/', '/platforms/', '/platforms/telegram/', '/draft/', '/evidence/', '/case/',
  '/tracker/', '/tracker/x/', '/tracker/compare/', '/tracker/methodology/', '/tracker/incidents/',
  '/learn/', '/learn/sextortion/', '/support/', '/insights/', '/about/',
];
export async function blockNeutralSite(page: Page) {
  await page.route('https://www.google.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>Weather</title><h1>Weather</h1>' }));
}
export async function answerHelpFlow(page: Page) {
  await page.goto('/help/');
  await page.getByTestId('q-safety').getByRole('button', { name: /safe right now/i }).click();
  await page.getByTestId('q-about').getByRole('button', { name: /^Me$/ }).click();
  await page.getByTestId('q-what').getByRole('button', { name: /fake or AI-made/i }).click();
  await page.getByTestId('q-next').click();
  await page.getByTestId('q-where').locator('[data-value="telegram"]').click();
  await page.getByTestId('q-where').locator('[data-value="x"]').click();
  await page.getByTestId('q-next').click();
  await page.getByTestId('q-who').getByRole('button', { name: /^No$/ }).click();
  await page.getByTestId('q-threat').getByRole('button', { name: /^No$/ }).click();
  await page.getByTestId('q-when').getByRole('button', { name: /Today/ }).click();
  await page.getByTestId('q-lang').getByRole('button', { name: /English/ }).click();
  await page.getByTestId('build-plan').click();
}
