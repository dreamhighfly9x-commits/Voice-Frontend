import {test,expect} from '@playwright/test';

test('script loads delayed library voices, selects a clone and generates with its ID',async({page})=>{
 let releaseVoices;
 const ready=new Promise(resolve=>{releaseVoices=resolve;});
 let sent;
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname,method=route.request().method();let body=[];
  if(path==='/api/auth/renew')body={access_token:'test'};
  else if(path==='/api/me')body={id:'test',name:'Test',roles:['super_admin'],permissions:[],limits:{max_chars_request:5000,max_chars_month:200000}};
  else if(path==='/api/local-usage')body={used_chars_month:0};
  else if(path==='/api/voices'){await ready;body=[{id:'an',name:'An',initial:'A',seed:1},{id:'bao',name:'Bảo',initial:'B',seed:2},{id:'clone_test',name:'Giọng riêng',initial:'G',seed:3}];}
  else if(path==='/api/scripts'&&method==='POST')body={...route.request().postDataJSON(),id:'s1',version:1};
  else if(path==='/api/scripts/s1')body={...route.request().postDataJSON(),version:2};
  else if(path==='/api/synthesize'){sent=route.request().postDataJSON();body={id:'a'.repeat(32),title:'Lời thoại thử',url:'/api/media/test.wav',dur:'0:01',meta:'WAV'};}
  await route.fulfill({json:body});
 });
 await page.goto('/');await page.getByText('Kịch bản nhiều giọng',{exact:true}).first().click();
 await expect(page.getByLabel('Giọng nhân vật 1')).toBeDisabled();
 releaseVoices();
 await expect(page.getByLabel('Giọng nhân vật 1')).toHaveValue('an');
 await expect(page.getByText('Đã nạp 3 giọng',{exact:false})).toBeVisible();
 await page.getByLabel('Tìm giọng trong thư viện').fill('giong rieng');
 await page.getByLabel('Giọng nhân vật 1').selectOption('clone_test');
 await page.getByLabel('Tìm giọng trong thư viện').fill('');
 await expect(page.getByLabel('Giọng nhân vật 1')).toHaveValue('clone_test');
 await page.getByRole('button',{name:'+ Thêm đoạn',exact:true}).click();
 await page.getByLabel('Lời thoại đoạn 1').fill('Xin chào, đây là lời thoại thử.');
 await page.getByRole('button',{name:'Tạo các đoạn chưa có âm thanh'}).click();
 await expect(page.getByRole('status')).toContainText('Đã tạo 1 đoạn');
 expect(sent.voice).toBe('clone_test');
 await page.getByText('Thư viện âm thanh',{exact:true}).first().click();
 await expect(page.getByTestId('library-row').getByText('Lời thoại thử',{exact:true})).toBeVisible();
 expect(errors).toEqual([]);
});
