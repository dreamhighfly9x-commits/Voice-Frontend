import {test,expect} from '@playwright/test';

for(const reduced of [false,true])test(`successful login reveal, reduced motion=${reduced}`,async({page})=>{
 await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
 let accept=false;
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/api/auth/renew'||(path==='/api/auth/login'&&!accept))return route.fulfill({status:401,json:{error:'Thông tin đăng nhập không đúng'}});
  let body=[];
  if(path==='/api/auth/login')body={access_token:'test'};
  if(path==='/api/me')body={id:'test',name:'Test',roles:['super_admin'],limits:{max_chars_request:5000,max_chars_month:200000}};
  if(path==='/api/dashboard')body={series:[],ranking:[],recent:[],recordings:0,usage:{}};
  await route.fulfill({json:body});
 });
 await page.goto('/login');
 await page.locator('#auth-email').fill('test@example.com');
 await page.locator('#auth-password').fill('testpassword');
 await page.locator('button[type=submit]').click();
 await expect(page.getByRole('alert')).toBeVisible();
 await expect(page.locator('.login-reveal')).toHaveCount(0);
 accept=true;await page.locator('button[type=submit]').click();
 if(!reduced){
  await expect(page.locator('.login-reveal')).toBeVisible();
  await expect(page.locator('.login-reveal-half')).toHaveCount(2);
  expect(await page.locator('.login-reveal input').evaluateAll(nodes=>nodes.every(n=>!n.value))).toBe(true);
 }
 await expect(page.locator('.login-reveal')).toHaveCount(0,{timeout:3000});
 await expect(page.getByRole('button',{name:'Thư viện giọng',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
});
