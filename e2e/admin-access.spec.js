import { test, expect } from '@playwright/test';
test('admin editor renders and persists role, denial, quota; responsive and dark', async ({page})=>{
 const limits={max_chars_month:200000,max_chars_request:5000,max_concurrent_jobs:2,max_clones:5,max_storage_mb:1024};
 const users=[{id:'admin',email:'admin@example.invalid',name:'Quản trị viên',roles:['admin'],overrides:{},is_suspended:false,...limits},{id:'member',email:'member@example.invalid',name:'Người dùng thử',roles:['user'],overrides:{},is_suspended:false,...limits}];
 let saved;
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  let body=[];
  if(path==='/api/auth/renew')body={access_token:'ui-test-token'};
  else if(path==='/api/me')body={id:'admin',email:'admin@example.invalid',roles:['admin'],permissions:['users.list','users.update','system.view_audit_log','voices.read','tts.create','recordings.download'],limits};
  else if(path==='/api/admin/users')body=users;
  else if(path==='/api/admin/permissions')body=['tts.create','clones.create','recordings.download','content.manage_all'].map(key=>({key,description:key,roles:key==='content.manage_all'?[]:['user','admin']}));
  else if(path==='/api/admin/users/member'){saved=route.request().postDataJSON();body={message:'ok'};}
  else if(path.startsWith('/api/local-usage'))body={used_chars_month:12400,clones:2,storage_bytes:24000000};
  await route.fulfill({json:body});
 });
 await page.goto('/');await page.getByText('Quản trị',{exact:true}).click();
 await page.getByRole('button',{name:/Người dùng thử/}).click();
 await expect(page.getByRole('heading',{name:'Người dùng & phân quyền'})).toBeVisible();
 await page.getByLabel('Tạo âm thanh').selectOption('false');
 await page.getByLabel('Giọng clone tối đa').fill('3');
 await page.screenshot({path:'test-results/admin-permissions-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Lưu quyền & hạn mức'}).click();
 await expect(page.getByRole('status')).toContainText('Đã lưu');
 expect(saved.overrides['tts.create']).toBe(false);expect(saved.max_clones).toBe(3);
 await page.setViewportSize({width:900,height:900});
 await page.getByRole('button',{name:/Người dùng thử/}).click();
 await page.screenshot({path:'test-results/admin-permissions-narrow.png',fullPage:true});
 await page.getByText('Tối',{exact:true}).click();
 await page.screenshot({path:'test-results/admin-permissions-dark.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
