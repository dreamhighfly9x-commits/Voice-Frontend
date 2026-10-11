import {test,expect} from '@playwright/test';

test('new brand logo renders on login, favicon and brand page',async({page,request})=>{
 await page.route('**/api/**',route=>route.fulfill({status:401,json:{code:'TOKEN_INVALID'}}));
 await page.setViewportSize({width:1280,height:900});await page.goto('/');
 const logo=page.getByRole('img',{name:'DreamHigh Voice - Text to Speech'}).first();
 await expect(logo).toBeVisible();
 const mark=logo.locator('img.dh-logo-mark');
 await expect(mark).toHaveAttribute('src','/brand/dreamhigh-logo-256.png');
 expect(await mark.evaluate(img=>img.complete&&img.naturalWidth)).toBe(256);
 await logo.screenshot({path:'test-results/dreamhigh-logo.png'});
 await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href','/favicon.png');
 for(const asset of ['/favicon.png','/apple-touch-icon.png','/brand/dreamhigh-logo.png'])expect((await request.get(asset)).status()).toBe(200);
 await page.goto('/brand/index.html');await expect(page).toHaveTitle('DreamHigh Voice — Logo');
 await expect(page.getByRole('img',{name:'DreamHigh Voice — Text to Speech'})).toBeVisible();
 await page.screenshot({path:'test-results/dreamhigh-brand-preview.png'});
});
