import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ROUTES } from './helpers';

const ALL = [...ROUTES, ...ROUTES.map((r) => (r === '/' ? '/hi/' : `/hi${r}`))];

test('no file upload control anywhere, and no third-party requests', async ({ page }) => {
  test.setTimeout(240_000);
  const foreign: string[] = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol !== 'data:' && u.protocol !== 'blob:') foreign.push(r.url()); });
  for (const r of ALL) {
    await page.goto(r);
    await page.waitForLoadState('networkidle');
    expect(await page.locator('input[type="file"]').count(), r).toBe(0);
  }
  expect(foreign).toEqual([]);
});

test('every page passes axe WCAG 2.1 AA checks', async ({ page }) => {
  test.setTimeout(300_000);
  for (const r of ALL) {
    await page.goto(r);
    await page.waitForLoadState('networkidle');
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const issues = res.violations.map((v) => `${r} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    expect(issues, issues.join('\n')).toEqual([]);
  }
});

test('the help flow works with the keyboard only', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard run on desktop');
  await page.goto('/help/');
  const pressUntil = async (name: RegExp) => {
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => (document.activeElement as HTMLElement)?.innerText ?? '');
      if (name.test(label)) return page.keyboard.press('Enter');
    }
    throw new Error(`could not reach ${name}`);
  };
  await pressUntil(/safe right now/i);
  await pressUntil(/^Me$/);
  await pressUntil(/fake or AI-made/i);
  await pressUntil(/^Next$/);
  await pressUntil(/^Instagram$/);
  await pressUntil(/^Next$/);
  for (let i = 0; i < 4; i++) await pressUntil(/^Skip$/);
  await pressUntil(/Build my plan/);
  await expect(page).toHaveURL(/\/plan\/$/);
  await expect(page.getByTestId('plan-list')).toContainText('Report on Instagram');
});

test('pages fit a 360 px screen without sideways scrolling', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  test.setTimeout(180_000);
  for (const r of ALL) {
    await page.goto(r);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, r).toBeLessThanOrEqual(1);
  }
});
