import {test,expect} from '@playwright/test';

test('voice preview ignores stale requests and reuses downloaded audio',async({page})=>{
  await page.addInitScript(()=>{
    window.audioPlays=0;
    window.Audio=class {pause(){} async play(){window.audioPlays++;}};
  });
  let releaseFirst;const firstReady=new Promise(resolve=>{releaseFirst=resolve;});
  let downloads=0,previews=0,syntheses=0;
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;let body=[];
    if(path==='/api/auth/renew')body={access_token:'test'};
    else if(path==='/api/me')body={id:'user',name:'Test',roles:['super_admin'],limits:{max_chars_request:5000,max_chars_month:200000}};
    else if(path==='/api/voices')body=['one','two'].map((id,i)=>({id,name:id,initial:id[0],seed:i+1}));
    else if(path==='/api/voice-preview'){
      previews++;const {voice}=route.request().postDataJSON();
      if(voice==='one')await firstReady;
      body={id:(voice==='one'?'a':'b').repeat(32),url:'/api/audio/'+voice+'.wav',title:voice};
    }else if(path.startsWith('/api/audio/')){downloads++;await route.fulfill({contentType:'audio/wav',body:'fake audio'});return;}
    else if(path==='/api/synthesize')syntheses++;
    else if(path==='/api/dashboard')body={series:[],ranking:[],recent:[],recordings:0,usage:{}};
    await route.fulfill({json:body});
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Thư viện giọng',exact:true}).click();
  const cards=page.getByTestId('voice-card');await expect(cards).toHaveCount(2);
  await cards.nth(0).getByTestId('play-button').click();
  await expect(cards.nth(0).getByRole('status')).toHaveText('Đang chuẩn bị mẫu…');
  await cards.nth(1).getByTestId('play-button').click();
  await expect(cards.nth(1).getByRole('button',{name:'Tạm dừng'})).toBeVisible();
  releaseFirst();
  await expect(cards.nth(0).getByRole('status')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>window.audioPlays)).toBe(1);
  await cards.nth(1).getByTestId('play-button').click();
  await cards.nth(1).getByTestId('play-button').click();
  await expect.poll(()=>page.evaluate(()=>window.audioPlays)).toBe(2);
  expect(downloads).toBe(1);expect(previews).toBe(3);expect(syntheses).toBe(0);
});
