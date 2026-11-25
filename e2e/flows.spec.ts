import { test, expect } from '@playwright/test';
import { answerHelpFlow, blockNeutralSite } from './helpers';
import type { Page } from '@playwright/test';

async function navTo(page: Page, name: string) {
  const desk = page.locator('header nav').first().getByRole('link', { name, exact: true });
  if (await desk.isVisible()) return desk.click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.locator('#mobile-nav').getByRole('link', { name, exact: true }).click();
}

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
  await page.locator('#new-plat').selectOption('x');
  await page.getByTestId('add-report').click();
  const card2 = page.getByTestId('report-x');
  const now = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 16);
  await card2.getByTestId('reported-at').fill(now);
  await expect(card2.getByTestId('countdown')).toContainText(/0[01]:\d\d:\d\d/);
});

test('report cards can be edited until the 2-hour timer starts, then lock', async ({ page }) => {
  await page.goto('/case/');
  await page.getByTestId('start-blank').click();
  await page.locator('#new-plat').selectOption('instagram');
  await page.getByTestId('add-report').click();
  let card = page.getByTestId('report-instagram');
  await expect(card.getByTestId('report-details')).toBeVisible();
  await card.getByTestId('edit-platform').selectOption('youtube');
  card = page.getByTestId('report-youtube');
  await card.getByTestId('edit-notes').fill('Reported the demo_video link');
  await card.getByTestId('report-toggle').click();
  await expect(card.getByTestId('report-details')).toHaveCount(0);
  await expect(card).toContainText('Reported the demo_video link');
  await card.getByTestId('report-toggle').click();
  await expect(card.getByTestId('edit-platform')).toBeVisible();
  await card.getByTestId('report-now').click();
  await expect(card.getByTestId('countdown')).toBeVisible();
  await expect(card.getByTestId('report-locked')).toBeVisible();
  await expect(card.getByTestId('edit-platform')).toHaveCount(0);
  await expect(card.getByTestId('edit-notes')).toHaveCount(0);
  await expect(card.getByTestId('status')).toBeVisible();
  await expect(card.getByTestId('status').locator('option[value=not_reported]')).toHaveCount(0);
  await card.getByTestId('status').selectOption('removed');
  await expect(card).toContainText('within the deadline');
});

test('in-app Back button returns to the previous page', async ({ page }) => {
  await page.goto('/plan/');
  await expect(page.getByTestId('back')).toBeVisible();
  await page.goto('/');
  await expect(page.getByTestId('back')).toHaveCount(0);
  await navTo(page, 'Platforms');
  await page.waitForURL(/\/platforms\/$/);
  await page.locator('a[href="/platforms/telegram/"]').first().click();
  await page.waitForURL(/\/platforms\/telegram\/$/);
  await page.getByTestId('back').click();
  await page.waitForURL(/\/platforms\/$/);
  await page.getByTestId('back').click();
  await page.waitForURL(/localhost:\d+\/$/);
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
  await expect(page.locator('p[role=status]')).toHaveText('Copied');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('cybercrime');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('draft-pdf').click()]);
  expect(dl.suggestedFilename()).toBe('reclaim-ncrp-draft.pdf');
  expect(browserName).toBe('chromium');
});

test('drafter shows where to send each draft, with copy buttons', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const clip = () => page.evaluate(() => navigator.clipboard.readText());
  await page.goto('/');
  await page.getByTestId('cta-demo').click();
  await page.goto('/draft/?t=grievance&p=telegram');
  const guide = page.getByTestId('send-guide');
  await expect(guide).toContainText('Where to send this');
  await expect(page.getByTestId('send-email')).toHaveText('grievance-in@telegram.org');
  await page.getByTestId('copy-email').click();
  expect(await clip()).toBe('grievance-in@telegram.org');
  await expect(page.getByTestId('copy-email')).toContainText('Copied');
  await page.getByTestId('copy-subject').click();
  expect(await clip()).toMatch(/^Urgent removal under Rule 3\(2\)\(b\)/);
  await page.getByTestId('copy-body').click();
  const body = await clip();
  expect(body).not.toMatch(/^Subject:/m);
  expect(body).toContain('This is not legal advice.');
  await expect(page.getByTestId('open-email')).toHaveAttribute('href', /^mailto:grievance-in@telegram\.org\?subject=Urgent/);
  await expect(guide).toContainText('gac.gov.in');

  await page.locator('#d-plat').selectOption('x');
  await expect(page.getByTestId('open-form')).toHaveAttribute('href', 'https://help.x.com/en/rules-and-policies/x-india');
  await expect(page.getByTestId('copy-email')).toHaveCount(0);
  await expect(guide).toContainText('cannot be contacted by email');
  await page.locator('#d-plat').selectOption('reddit');
  await expect(page.getByTestId('send-contact')).toContainText('could not confirm');

  await page.getByTestId('tpl-ncrp').click();
  await expect(guide).toContainText('Report and Track');
  await expect(guide).toContainText('1930');
  await expect(guide.getByRole('link', { name: /MHA citizen manual/ })).toHaveAttribute('href', /cybercrime\.gov\.in/);
  await page.getByTestId('draft-copy-top').click();
  expect(await clip()).toContain('cybercrime');
  await page.getByTestId('tpl-police').click();
  await expect(guide).toContainText('Zero FIR');
  await expect(guide).toContainText('112');

  await page.goto('/hi/draft/?t=grievance&p=whatsapp');
  await expect(page.getByTestId('send-guide')).toContainText('इसे कहाँ भेजें');
  await expect(page.getByTestId('send-email')).toHaveText('grievance_officer_wa@support.whatsapp.com');
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
  await page.locator('html[data-esc-ready="1"]').waitFor({ state: 'attached' });
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
  await page.getByTestId('evidence-open').click();
  await page.locator('[data-testid=evidence-edit] input[type=url]').fill('https://example.com/demo_edited');
  await page.getByTestId('evidence-save').click();
  await expect(page.getByTestId('evidence-list')).toContainText('example.com/demo_edited');
  await expect(page.getByTestId('evidence-list')).not.toContainText('demo_test');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-csv').click()]);
  expect(dl.suggestedFilename()).toBe('reclaim-evidence-log.csv');
});

test('PIN is asked every time a private page opens', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('cta-demo').click();
  await page.getByTestId('tour-exit').click();
  await page.goto('/case/');
  await page.getByTestId('start-blank').click();
  await page.getByTestId('privacy-settings').click();
  await page.getByLabel('Lock my case with a PIN').fill('4821');
  await page.getByRole('button', { name: 'Set PIN' }).click();
  await expect(page.getByText('PIN saved')).toBeVisible();
  await page.keyboard.press('Escape');
  await navTo(page, 'Evidence');
  await expect(page.getByText('This page is locked')).toBeVisible();
  await page.getByLabel('4 digits').fill('1111');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByText('That PIN is not right')).toBeVisible();
  await page.getByLabel('4 digits').fill('4821');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('heading', { name: 'Evidence kit' })).toBeVisible();
  await navTo(page, 'My case');
  await expect(page.getByText('This page is locked')).toBeVisible();
  await page.getByLabel('4 digits').fill('4821');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('heading', { name: 'Case tracker' })).toBeVisible();
});
