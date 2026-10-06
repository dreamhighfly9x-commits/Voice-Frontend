import {test,expect} from '@playwright/test';

test('login design works on desktop and mobile with account modes',async({page})=>{
 await page.route('**/api/**',route=>route.fulfill({status:401,json:{error:'Email hoặc mật khẩu không đúng'}}));
 await page.setViewportSize({width:1440,height:950});await page.goto('/');
 await expect(page.getByRole('heading',{name:'Chào mừng trở lại.'})).toBeVisible();
 await page.getByLabel('Địa chỉ email').fill('demo@example.com');
 await page.getByLabel('Mật khẩu',{exact:true}).fill('testpassword');
 await page.getByRole('button',{name:'Hiện mật khẩu',exact:true}).click();
 await expect(page.getByLabel('Mật khẩu',{exact:true})).toHaveAttribute('type','text');
 await page.getByRole('button',{name:'Ẩn mật khẩu',exact:true}).click();
 await page.screenshot({path:'test-results/auth-desktop.png',fullPage:true});
 await page.locator('button[type=submit]').click();await expect(page.getByRole('alert')).toBeVisible();
 await page.getByRole('button',{name:'Đăng ký',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Bắt đầu sáng tạo.'})).toBeVisible();
 await page.getByRole('button',{name:'Đã có token xác thực email?'}).click();
 await expect(page.getByLabel('Token xác thực email',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Quay lại đăng nhập'}).click();
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/auth-mobile.png',fullPage:true});
});
