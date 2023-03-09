import { expect } from '@playwright/test';
import * as fs from 'fs';

import test from '../fixtures/fixtures';
import { baseUrlToDomain, login, startDockerClient, stopDockerClient, tenantTokenRetrieval } from '../utils/commands';
import { selectors } from '../utils/constants';

test.describe('Test setup', () => {
  test.describe('basic window checks', () => {
    test('get the global window object', async ({ baseUrl, context, page }) => {
      page = await context.newPage();
      await page.goto(`${baseUrl}ui/`);
      const theWindow = await page.evaluate(() => window.innerWidth);
      expect(theWindow).toBeDefined();
      try {
        fs.unlinkSync('loginInfo.json');
        await stopDockerClient();
      } catch (error) {
        // ...continue
      }
    });
    test('get the document object', async ({ page }) => {
      const documentCharset = await page.evaluate(() => document.charset);
      expect(documentCharset).toBeDefined();
      expect(documentCharset).toEqual('UTF-8');
    });
    test('get the title', async ({ baseUrl, context, page }) => {
      page = await context.newPage();
      await page.goto(`${baseUrl}ui/`);
      expect(await page.title()).toContain('Mender');
    });
  });

  test.describe('account creation', () => {
    test('allows account creation', async ({ baseUrl, context, environment, page, password, username }) => {
      test.skip(environment !== 'staging');
      try {
        const { token } = await login(username, password, baseUrl);
        test.skip(!!token, 'looks like the account was created already, continue with the remaining tests');
      } catch (error) {
        // looks like this is the first run, let's continue
      }
      await page.goto(`${baseUrl}ui/`);
      expect(await page.isVisible('text=/Sign up/i')).toBeTruthy();
      await page.click(`text=/Sign up/i`);
      console.log(`creating user with username: ${username} and password: ${password}`);
      await page.fill(selectors.email, username);
      await page.fill(selectors.passwordNew, password);
      await page.fill(selectors.passwordNew, '');
      await page.fill(selectors.passwordNew, password);
      await page.fill(selectors.passwordConfirmation, password);

      await page.click(`button:has-text('Sign up')`);
      await page.waitForSelector(`button:has-text('Complete')`);
      await page.fill('[id=name]', 'CI test corp');
      await page.check('[id=tos]');
      const frameHandle = await page.waitForSelector('iframe[title="reCAPTCHA"]');
      await page.waitForTimeout(300);
      const recaptchaFrame = await frameHandle.contentFrame();
      await recaptchaFrame.waitForSelector('#recaptcha-anchor');
      const recaptcha = await recaptchaFrame.$('#recaptcha-anchor');
      await recaptcha.click();
      await page.waitForTimeout(2000);
      await page.click(`button:has-text('Complete')`);
      await page.waitForTimeout(5000);
      await page.waitForSelector('text=/License information/i', { timeout: 15000 });

      // the following sets the UI up for easier navigation by disabling onboarding
      const domain = baseUrlToDomain(baseUrl);
      const { token, userId } = await login(username, password, baseUrl);
      await context.addCookies([
        { name: 'JWT', value: token, path: '/', domain },
        { name: `${userId}-onboarded`, value: 'true', path: '/', domain },
        { name: 'cookieconsent_status', value: 'allow', path: '/', domain }
      ]);
      const newPage = await context.newPage();
      await newPage.goto(baseUrl);
      await page.evaluate(() => localStorage.setItem(`onboardingComplete`, 'true'));
      await newPage.waitForSelector('text=/License information/i');
      await context.storageState({ path: 'storage.json' });
    });
  });

  test.describe('enterprise setting features, that happens to start up a docker client', () => {
    test('supports tenant token retrieval', async ({ baseUrl, context, environment, password, username }) => {
      test.skip(!['enterprise', 'staging'].includes(environment));
      console.log(`logging in user with username: ${username} and password: ${password}`);
      const { token: JWT, userId } = await login(username, password, baseUrl);
      const domain = baseUrlToDomain(baseUrl);
      await context.addCookies([
        { name: 'JWT', value: JWT, path: '/', domain },
        { name: `${userId}-onboarded`, value: 'true', path: '/', domain },
        { name: 'cookieconsent_status', value: 'allow', path: '/', domain }
      ]);
      const page = await context.newPage();
      await page.goto(`${baseUrl}ui/settings`);
      const isVisible = await page.isVisible(`text=/Change email/i`);
      if (!isVisible) {
        console.log('settings may not be loaded - move around');
        await page.goto(`${baseUrl}ui/help`);
        await page.goto(`${baseUrl}ui/settings`);
      }
      const token = await tenantTokenRetrieval(baseUrl, page);
      if (environment === 'staging') {
        await startDockerClient(baseUrl, token);
      }
      await context.storageState({ path: 'storage.json' });
      expect(token).toBeTruthy();
    });
  });
});
