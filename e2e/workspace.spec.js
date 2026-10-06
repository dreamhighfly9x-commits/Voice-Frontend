import {test,expect} from '@playwright/test';

test('multi voice editing, generation, merge and account preferences',async({page})=>{
 let script=null,profile={name:'Test User',email:'test@example.invalid',avatar:'',totp_enabled:false,preferences:{theme:'light',sound:true,default_voice:'an'}},parts=[];
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname,method=route.request().method();let body=[];
  if(path==='/api/auth/renew')body={access_token:'test'};
  else if(path==='/api/me')body={id:'tester',name:profile.name,email:profile.email,roles:['super_admin'],permissions:[],limits:{max_chars_request:5000,max_chars_month:200000,max_clones:10,max_storage_mb:100,max_concurrent_jobs:1}};
  else if(path==='/api/auth/profile'){if(method==='PATCH')profile=route.request().postDataJSON();body=profile;}
  else if(path==='/api/voices')body=[{id:'an',name:'An',initial:'A',seed:1},{id:'bao',name:'Bao',initial:'B',seed:2}];
  else if(path==='/api/local-usage')body={used_chars_month:123,clones:0,storage_bytes:100};
  else if(path==='/api/scripts/merge/audio'){parts=route.request().postDataJSON().parts;body={id:'c'.repeat(32),title:'Merged',url:'/api/media/merged.wav'};}
  else if(path==='/api/scripts'||path==='/api/scripts/script1'){if(method==='POST'||method==='PUT'){script={...route.request().postDataJSON(),id:'script1',version:(script?.version||0)+1,updated:1700000000};body=script;}else body=path.endsWith('script1')?script:script?[{...script,segments:script.segments.length}]:[];}
  else if(path==='/api/synthesize'){const data=route.request().postDataJSON();body={id:(data.voice==='an'?'a':'b').repeat(32),title:data.text,url:'/api/media/test.wav'};}
  await route.fulfill({json:body});
 });
 await page.goto('/');await page.getByText('Kịch bản nhiều giọng',{exact:true}).first().click();
 await page.getByLabel('Tên kịch bản').fill('Đối thoại thử');
 await page.getByLabel('Kịch bản có nhãn').fill('Người dẫn: Xin chào.\nLan: Chào bạn.');
 await page.getByRole('button',{name:'Nhập lời thoại',exact:true}).click();
 await page.getByLabel('Giọng nhân vật 2').selectOption('bao');
 await page.getByRole('button',{name:'Lưu kịch bản',exact:false}).click();
 await expect(page.getByRole('status')).toContainText('Đã lưu');
 await page.getByRole('button',{name:'Tạo các đoạn chưa có âm thanh'}).click();
 await expect(page.getByRole('status')).toContainText('Đã tạo 2 đoạn');
 await page.getByRole('button',{name:'Ghép âm thanh',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Đã ghép WAV');expect(parts).toHaveLength(2);expect(parts[0].id).not.toBe(parts[1].id);
 await page.screenshot({path:'test-results/script-working.png',fullPage:true});
 await page.getByText('Cài đặt tài khoản',{exact:true}).first().click();
 await page.getByLabel('Tên hiển thị').fill('Tên đã sửa');await page.getByLabel('Giọng mặc định').selectOption('bao');await page.getByLabel('Giao diện',{exact:true}).selectOption('dark');
 await page.getByRole('button',{name:'Lưu thay đổi'}).click();await expect(page.getByRole('status')).toContainText('Đã lưu hồ sơ');expect(profile.name).toBe('Tên đã sửa');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.screenshot({path:'test-results/settings-working.png',fullPage:true});
 expect(errors).toEqual([]);
});
