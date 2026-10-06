import { test, expect } from '@playwright/test';

test('Studio imports, edits pronunciation, splits and sends processed text', async ({page})=>{
  let sent;
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let body=[];
    if(path==='/api/auth/renew')body={access_token:'test-token'};
    else if(path==='/api/me')body={id:'studio-test',email:'studio@example.invalid',roles:['user'],permissions:['voices.read','tts.create','recordings.download'],limits:{max_chars_request:5000,max_chars_month:200000}};
    else if(path==='/api/voices')body=[{id:'an',name:'An',initial:'A',tags:'Tiếng Việt',desc:'Giọng nữ',seed:1}];
    else if(path==='/api/local-usage')body={used_chars_month:0};
    else if(path==='/api/import-text')body={text:'AI giúp bạn đọc văn bản. Xin chào Việt Nam!'};
    else if(path==='/api/synthesize'){sent=route.request().postDataJSON();body={id:'result',title:'Bản ghi thử',url:'/api/media/result.wav',meta:'AN · WAV',dur:'0:05',seed:1};}
    await route.fulfill({json:body});
  });
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Tạo âm thanh',exact:true})).toBeEnabled();
  await page.getByLabel('Chọn tài liệu').setInputFiles({name:'noi-dung.txt',mimeType:'text/plain',buffer:Buffer.from('AI giúp bạn đọc văn bản. Xin chào Việt Nam!')});
  await page.getByRole('button',{name:'Thay nội dung hiện tại'}).click();
  const editor=page.getByRole('textbox',{name:'Nội dung chuyển thành giọng nói'});
  await expect(editor).toHaveValue('AI giúp bạn đọc văn bản. Xin chào Việt Nam!');
  await page.getByRole('button',{name:'Từ điển phát âm',exact:true}).click();
  await page.getByLabel('Từ gốc mới').fill('AI');await page.getByLabel('Cách đọc mới').fill('ây ai');
  await page.getByRole('button',{name:'Thêm từ'}).click();
  await page.screenshot({path:'test-results/studio-tools.png',fullPage:true});
  await page.getByRole('button',{name:'Lưu từ điển'}).click();
  await page.getByRole('button',{name:/Chia đoạn tự động/}).click();
  await page.getByRole('button',{name:'Tạo âm thanh',exact:true}).click();
  await expect(page.getByText('Đã tạo và lưu bản ghi WAV.')).toBeVisible();
  expect(sent.text).toBe('ây ai giúp bạn đọc văn bản. Xin chào Việt Nam!');
  await page.reload();
  await expect(page.getByRole('button',{name:'Từ điển phát âm (1)'})).toBeVisible();
});
