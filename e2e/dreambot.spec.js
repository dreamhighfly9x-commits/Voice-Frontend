import {test,expect} from '@playwright/test';

test('DreamBot follows real task and player events without repeated celebrations',async({page})=>{
 let phase='queued',release,created=false;
 const ready=new Promise(resolve=>{release=resolve;});
 const record={id:'a'.repeat(32),url:'/api/media/bot.wav',title:'DreamBot test',dur:'0:03',created_at:Date.now()/1000};
 await page.addInitScript(()=>{
  window.Audio=class {
   constructor(){window.botAudio=this;}
   play(){return new Promise(resolve=>{window.startBotAudio=()=>{this.onplaying?.();resolve();};});}
   pause(){this.onpause?.();}
  };
 });
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;let body=[];
  if(path==='/api/auth/renew')body={access_token:'test'};
  else if(path==='/api/me')body={id:'bot-user',name:'Dream',roles:['super_admin'],limits:{max_chars_request:5000,max_chars_month:200000}};
  else if(path==='/api/voices')body=[{id:'an',name:'An',initial:'A',seed:1}];
  else if(path==='/api/synthesize'){await ready;created=true;body=record;}
  else if(path.startsWith('/api/tts-activity/'))body={state:phase};
  else if(path==='/api/dashboard')body={series:[],ranking:[],recent:created?[record]:[],recordings:created?1:0,usage:{}};
  else if(path.startsWith('/api/media/')){await route.fulfill({contentType:'audio/wav',body:'test audio'});return;}
  await route.fulfill({json:body});
 });
 await page.setViewportSize({width:1440,height:1000});await page.goto('/');
 const bot=page.locator('.dreambot');await expect(bot).toHaveAttribute('data-state','welcome');
 await expect(page.locator('.dreambot img')).toBeVisible();
 await page.getByRole('button',{name:'Chuyển văn bản',exact:true}).click();
 await expect(page.getByRole('complementary',{name:'DreamBot đồng hành'})).toBeVisible();
 await page.screenshot({path:'test-results/dreambot-studio-light.png',fullPage:true});
 await page.getByRole('button',{name:'Tạo âm thanh',exact:true}).click();
 await page.getByRole('button',{name:'Tổng quan',exact:true}).click();
 await expect(page.locator('.dreambot-message')).toHaveText('Đang chờ đến lượt…');
 phase='generating';await expect(page.locator('.dreambot-message')).toHaveText('Mình đang tạo giọng cho bạn…');
 await page.locator('.daily-greeting').screenshot({path:'test-results/dreambot-generating.png'});
 release();await expect(bot).toHaveAttribute('data-state','success');
 await page.getByRole('button',{name:/DreamBot test/}).click();
 await expect.poll(()=>page.evaluate(()=>typeof window.startBotAudio)).toBe('function');
 await expect(bot).toHaveAttribute('data-state','idle',{timeout:4000});
 await page.evaluate(()=>window.startBotAudio());await expect(bot).toHaveAttribute('data-state','playing');
 await page.locator('.daily-greeting').screenshot({path:'test-results/dreambot-playing.png'});
 await page.evaluate(()=>window.botAudio.pause());await expect(bot).toHaveAttribute('data-state','idle');
 await page.getByRole('button',{name:'Thư viện giọng',exact:true}).click();
 await expect(page.locator('.dreambot-companion-copy p')).toContainText('Cùng tìm một giọng đọc');
 await page.getByRole('button',{name:'Giao diện tối',exact:true}).click();
 await page.screenshot({path:'test-results/dreambot-voices-dark.png',fullPage:true});
 await page.getByRole('button',{name:'Tổng quan',exact:true}).click();
 await expect(bot).toHaveAttribute('data-state','idle');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(bot).toHaveAttribute('data-paused','true');
 expect(await page.locator('.dreambot-body').evaluate(el=>getComputedStyle(el).animationPlayState)).toBe('paused');
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 expect(await page.locator('.dreambot-body').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.daily-greeting').screenshot({path:'test-results/dreambot-mobile.png'});
 await page.getByRole('button',{name:'Chuyển văn bản',exact:true}).click();
 await expect(page.locator('.dreambot-companion')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/dreambot-companion-mobile.png',fullPage:true});
});
