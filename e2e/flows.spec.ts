import { test, expect } from '@playwright/test';
import { answerHelpFlow, blockNeutralSite } from './helpers';

test('help flow builds a plan and saves a case', async ({ page }) => {
  const t0 = Date.now();
  await answerHelpFlow(page);
  await expect(page).toHaveURL(/\/plan\/$/);
  const list = page.getByTestId('plan-list');
  await expect(list).toContainText('Report on X');
  await expect(list).toContainText('Report on Telegram');
  await expect(list.locator('li').first()).toContainText('not your fault');
  await page.getByTestId('save-case').click();
  await page.goto('/case/');
  await expect(page.getByTestId('report-telegram')).toBeVisible();
  await expect(page.getByTestId('report-x')).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(60_000);
});

test('choosing under 18 always stops the normal flow', async ({ page }) => {
  await page.goto('/help/');
  await page.getByTestId('q-safety').getByRole('button', { name: /safe right now/i }).click();
  await page.getByTestId('q-about').locator('[data-value="minor"]').click();
  await expect(page).toHaveURL(/\/under-18\/$/);
  await expect(page.getByTestId('under-18')).toContainText('Do not save, forward or screenshot');
  await expect(page.getByText('1098').first()).toBeVisible();
  await page.goto('/plan/');
  await expect(page.getByTestId('plan-list')).toHaveCount(0);
});

test('danger answer shows 112 and stops', async ({ page }) => {
  await page.goto('/help/');
  await page.getByTestId('q-safety').getByRole('button', { name: /in danger/i }).click();
  await expect(page.getByTestId('danger')).toContainText('112');
  await expect(page.locator('a[href="tel:112"]')).toBeVisible();
});

test('demo tour runs end to end without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await page.getByTestId('cta-demo').click();
  const tour = page.getByTestId('tour');
  await expect(tour).toContainText('Step 1 of 8');
  for (let i = 2; i <= 8; i++) {
    await page.getByTestId('tour-next').click();
    await expect(tour).toContainText(`Step ${i} of 8`);
  }
  await expect(page).toHaveURL(/\/learn\/$/);
  await page.getByTestId('tour-exit').click();
  await expect(tour).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('demo case shows a missed deadline with an escalate button', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('cta-demo').click();
  await page.goto('/case/');
  await expect(page.getByTestId('report-telegram').getByTestId('overdue')).toContainText('Deadline missed: escalate');
  await expect(page.getByTestId('report-x').getByTestId('removed-late')).toContainText('after the deadline');
  await page.getByTestId('report-telegram').getByTestId('escalate').click();
  await expect(page).toHaveURL(/\/draft\/\?t=grievance&p=telegram/);
  await expect(page.getByTestId('draft-output')).toHaveValue(/Rule 3\(2\)\(b\)/);
});

test('a report logged more than 2 hours ago shows Deadline missed', async ({ page }) => {
  await page.goto('/case/');
  await page.getByTestId('start-blank').click();
  await page.getByTestId('add-report').click();
  const card = page.locator('[data-testid^="report-"]').first();
  const d = new Date(Date.now() - 3 * 3600_000 + 5.5 * 3600_000).toISOString().slice(0, 16);
  await card.getByTestId('reported-at').fill(d);
  await expect(card.getByTestId('overdue')).toBeVisible();
  await expect(card.getByTestId('escalate')).toBeVisible();
  const now = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 16);
  await card.getByTestId('reported-at').fill(now);
  await expect(card.getByTestId('countdown')).toContainText(/0[01]:\d\d:\d\d/);
});

test('drafter makes all 4 templates in both languages, copies and downloads a PDF', async ({ page, context, browserName }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByTestId('cta-demo').click();
  await page.goto('/draft/?t=ncrp');
  const out = page.getByTestId('draft-output');
  await expect(out).toHaveValue(/@demo_channel_123/);
  for (const id of ['ncrp', 'grievance', 'police', 'followup']) {
    await page.getByTestId(`tpl-${id}`).click();
    await page.getByTestId('draft-lang-en').click();
    await expect(out).toHaveValue(/This is not legal advice\./);
    await page.getByTestId('draft-lang-hi').click();
    await expect(out).toHaveValue(/यह क़ानूनी सलाह नहीं है।/);
  }
  await page.getByTestId('draft-lang-en').click();
  await page.getByTestId('tpl-ncrp').click();
  await page.getByTestId('draft-copy').click();
  await expect(page.getByText('Copied')).toBeVisible();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('cybercrime');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('draft-pdf').click()]);
  expect(dl.suggestedFilename()).toBe('reclaim-ncrp-draft.pdf');
  expect(browserName).toBe('chromium');
});

test('language switch moves to Hindi routes', async ({ page }) => {
  await page.goto('/support/');
  await page.getByTestId('lang-switch').click();
  await expect(page).toHaveURL(/\/hi\/support\/$/);
  await expect(page.locator('h1')).toContainText('सहायता');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await page.getByTestId('lang-switch').click();
  await expect(page).toHaveURL(/\/support\/$/);
  await expect(page.locator('h1')).toContainText('Support');
});

test('Leave now leaves the site and Back does not return', async ({ page }) => {
  await blockNeutralSite(page);
  await page.goto('about:blank');
  await page.goto('/');
  await page.getByTestId('cta-help').click();
  await expect(page).toHaveURL(/\/help\/$/);
  await page.locator('footer').getByRole('link', { name: 'Insights' }).click();
  await expect(page).toHaveURL(/\/insights\/$/);
  await page.locator('footer').getByRole('link', { name: 'About and privacy' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await page.getByTestId('leave-now').click();
  await page.waitForURL(/google\.com/);
  await page.goBack().catch(() => null);
  expect(page.url()).not.toContain('localhost:4321');
});

test('Esc leaves the site', async ({ page }) => {
  await blockNeutralSite(page);
  await page.goto('/tracker/');
  await page.keyboard.press('Escape');
  await page.waitForURL(/google\.com/);
});

test('Delete everything leaves localStorage empty', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('cta-demo').click();
  await page.goto('/case/');
  expect(await page.evaluate(() => localStorage.length)).toBeGreaterThan(0);
  await page.getByTestId('delete-everything').click();
  await page.getByTestId('confirm-delete').click();
  await expect(page.getByText('Everything was deleted from this browser.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.reload();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test('evidence log adds entries and exports CSV', async ({ page }) => {
  await page.goto('/evidence/');
  await page.locator('#ev-url').fill('not a url');
  await page.getByTestId('add-evidence').click();
  await expect(page.getByText('Enter a full link')).toBeVisible();
  await page.locator('#ev-url').fill('https://example.com/demo_test');
  await page.locator('#ev-handle').fill('@demo_someone');
  await page.getByTestId('add-evidence').click();
  await expect(page.getByTestId('evidence-list')).toContainText('example.com/demo_test');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-csv').click()]);
  expect(dl.suggestedFilename()).toBe('reclaim-evidence-log.csv');
});

test('PIN locks the case on this device', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('cta-demo').click();
  await page.getByTestId('tour-exit').click();
  await page.goto('/case/');
  await page.getByTestId('start-blank').click();
  await page.getByTestId('privacy-settings').click();
  await page.getByLabel('Lock my case with a PIN').fill('4821');
  await page.getByRole('button', { name: 'Set PIN' }).click();
  await expect(page.getByText('PIN saved')).toBeVisible();
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.getByText('This page is locked')).toBeVisible();
  await page.getByLabel('4 digits').fill('1111');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByText('That PIN is not right')).toBeVisible();
  await page.getByLabel('4 digits').fill('4821');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByText('Case tracker')).toBeVisible();
});
