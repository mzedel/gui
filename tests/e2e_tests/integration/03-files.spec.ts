import * as fs from 'fs';
import { expect } from '@playwright/test';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js';
import md5 from 'md5';
import test from '../fixtures/fixtures';

dayjs.extend(isBetween);

test.describe('Files', () => {
  const fileName = 'mender-demo-artifact.mender';
  test.use({ storageState: 'storage.json' });

  test('allows file uploads', async ({ loggedInPage: page }) => {
    await page.click(`.leftNav :text('Releases')`);
    // create an artifact to download first
    await page.click(`button:has-text('Upload')`);
    await page.setInputFiles('.MuiDialog-paper .dropzone input', `fixtures/${fileName}`);
    await page.click(`.MuiDialog-paper button:has-text('Upload')`);
    // give some extra time for the upload
    await page.waitForTimeout(5000);
  });

  // test('allows uploading custom file creations', () => {
  //   cy.exec('mender-artifact write rootfs-image -f core-image-full-cmdline-qemux86-64.ext4 -t qemux86-64 -n release1 -o qemux86-64_release_1.mender')
  //     .then(result => {
  //       expect(result.code).to.be.equal(0)
  //         const encoding = 'base64'
  //         const fileName = 'qemux86-64_release_1.mender'
  //         cy.readFile(fileName, encoding).then(fileContent => {
  //           cy.get('.dropzone input')
  //             .upload({ fileContent, fileName, encoding, mimeType: 'application/octet-stream' })
  //             .wait(10000) // give some extra time for the upload
  //         })
  //       })
  // })

  test('allows artifact downloads', async ({ loggedInPage: page }) => {
    await page.click(`.leftNav :text('Releases')`);
    await page.click('.expandButton');
    await page.waitForSelector(`a:has-text('Download Artifact'), button:has-text('Download Artifact')`, { timeout: 2000 });
    expect(await page.isVisible(`a:has-text('Download Artifact'), button:has-text('Download Artifact')`)).toBeTruthy();
    const [download] = await Promise.all([page.waitForEvent('download'), page.click(`a:has-text('Download Artifact'), button:has-text('Download Artifact')`)]);
    const path = await download.path();
    const newFile = await fs.readFileSync(path);
    const testFile = await fs.readFileSync(`fixtures/${fileName}`);
    expect(md5(newFile)).toEqual(md5(testFile));
  });

  test('allows file transfer', async ({ environment, loggedInPage: page }) => {
    test.skip(!['enterprise', 'staging'].includes(environment));
    await page.click(`.leftNav :text('Devices')`);
    await page.click(`.deviceListItem`);
    // the deviceconnect connection might not be established right away
    await page.waitForSelector('text=/file transfer/i', { timeout: 10000 });
    await page.click(`css=.expandedDevice >> text=file transfer`);
    await page.waitForSelector(`text=Connection with the device established`, { timeout: 10000 });
    await page.setInputFiles('.MuiDialog-paper .dropzone input', `fixtures/${fileName}`);
    await page.click('[placeholder*=Example]', { clickCount: 3 });
    await page.type('[placeholder*=Example]', `/tmp/${fileName}`);
    await page.click('css=button >> text=Upload');
    await page.click('css=.navLink >> text=Download');
    await page.type('[placeholder*=Example]', `/tmp/${fileName}`);
    expect(await page.isVisible(`css=button >> text=Download`)).toBeTruthy();
    const [download] = await Promise.all([page.waitForEvent('download'), page.click(`css=button >> text=Download`)]);
    const downloadTargetPath = await download.path();
    const newFile = await fs.readFileSync(downloadTargetPath);
    const testFile = await fs.readFileSync(`fixtures/${fileName}`);
    expect(md5(newFile)).toEqual(md5(testFile));
  });
});
