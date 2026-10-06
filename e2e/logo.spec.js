import {test,expect} from '@playwright/test';

test('logo matches the brand and respects reduced motion',async({page})=>{
 await page.route('**/api/**',route=>route.fulfill({status:401,json:{code:'TOKEN_INVALID'}}));
 await page.setViewportSize({width:1280,height:900});await page.goto('/');
 const logo=page.locator('.auth-brand-logo');
 await expect(logo).toBeVisible();
 await expect(logo.locator('.dh-wave')).toHaveCount(3);
 expect(await logo.locator('.dh-wave-one').evaluate(el=>getComputedStyle(el).animationName)).toBe('dh-wave-pulse');
 const phases=await logo.locator('.dh-wave').evaluateAll(els=>els.map(el=>getComputedStyle(el).animationDelay));
 expect(new Set(phases).size).toBe(3);
 await logo.screenshot({path:'test-results/dreamhigh-logo.png',animations:'disabled'});
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await logo.locator('.dh-wave-one').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await page.goto('/brand/index.html');await expect(page).toHaveTitle('DreamHigh Voice — Logo');await expect(page.getByRole('img',{name:'DreamHigh Voice — Text to Speech'})).toBeVisible();
 await page.screenshot({path:'test-results/dreamhigh-brand-preview.png',animations:'disabled'});
});
