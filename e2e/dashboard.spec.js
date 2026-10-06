import {test,expect} from '@playwright/test';
test.use({timezoneId:'Asia/Tokyo'});

test('overview analytics, ranking selection and responsive design',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const names=['Minh Quân','Ngọc Huyền','Hồng Phúc','Thảo Nguyên','Tuấn Anh'];
 const voices=names.map((name,i)=>({id:'voice'+i,name,initial:name[0],tags:'Tiếng Việt',seed:i+1}));
 const series=Array.from({length:7},(_,i)=>({date:`2026-09-${16+i}`,created:[4,8,5,12,7,16,10][i],listen:i*2,download:i,seconds:120*i}));
 let requests=[];
 await page.route('**/api/**',async route=>{
  const url=new URL(route.request().url()),path=url.pathname;let body=[];
  if(path==='/api/auth/renew')body={access_token:'test'};
  else if(path==='/api/me')body={id:'user',name:'Minh Anh',email:'test@example.invalid',roles:['super_admin'],limits:{max_chars_request:5000,max_chars_month:200000}};
  else if(path==='/api/voices')body=voices;
  else if(path==='/api/local-usage')body={used_chars_month:48620};
  else if(path==='/api/dashboard'){requests.push(url.searchParams.get('days'));body={series,days:Number(url.searchParams.get('days')),active_days:7,recordings:124,usage:{used_chars_month:48620},ranking:voices.map((v,i)=>({id:v.id,count:24-i*5})),recent:[{id:'a'.repeat(32),title:'Lời chào cho một ngày mới',dur:'1:20',created_at:1790035000},{id:'b'.repeat(32),title:'Câu chuyện của mùa thu',dur:'2:45',created_at:1790030000}]};}
  await route.fulfill({json:body});
 });
 await page.clock.install({time:new Date('2026-09-21T14:59:50Z')});
 await page.setViewportSize({width:1440,height:1100});await page.goto('/');
 await expect(page.getByRole('heading',{name:'Hôm nay bạn muốn tạo giọng gì?'})).toBeVisible();
 await expect(page.locator('.daily-calendar time')).toContainText(/Thứ hai/i);
 await expect(page.getByRole('button',{name:'Xem ảnh 1',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.clock.runFor(3000);
 await expect(page.getByRole('button',{name:'Xem ảnh 2',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.clock.runFor(8000);
 await expect(page.locator('.daily-calendar time')).toContainText(/Thứ ba/i);
 await expect(page.locator('.daily-week [aria-current=date]')).toHaveText('T3');
 await page.locator('.daily-greeting').screenshot({path:'test-results/daily-greeting.png',animations:'disabled'});
 await expect(page.getByRole('heading',{name:'Top 5 giọng đọc'})).toBeVisible();
 await expect(page.locator('.ranking-row')).toHaveCount(5);
 await expect(page.getByText('24',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'30 ngày',exact:true}).click();await expect.poll(()=>requests.at(-1)).toBe('30');
 await page.getByRole('button',{name:'7 ngày',exact:true}).click();await expect.poll(()=>requests.at(-1)).toBe('7');
 await page.screenshot({path:'test-results/dashboard-desktop.png',fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Xem bảng số liệu'}).click();await expect(page.getByRole('table')).toBeVisible();
 await page.getByRole('button',{name:'Ẩn bảng số liệu'}).click();
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/dashboard-mobile.png',fullPage:true,animations:'disabled'});
 await page.setViewportSize({width:1440,height:1100});
 await page.locator('.ranking-row').first().getByRole('button',{name:'Sử dụng'}).click();
 await expect(page.getByRole('textbox',{name:'Nội dung chuyển thành giọng nói'})).toBeVisible();
 await page.screenshot({path:'test-results/studio-redesign.png',fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Tổng quan',exact:true}).click();
 await page.getByRole('button',{name:'Giao diện tối',exact:true}).click();
 await page.screenshot({path:'test-results/dashboard-dark.png',fullPage:true,animations:'disabled'});
 expect(errors).toEqual([]);
});

test('empty history is shown honestly and the API error can be retried',async({page})=>{
 let failed=true;
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;let body=[];
  if(path==='/api/auth/renew')body={access_token:'test'};
  else if(path==='/api/me')body={id:'new-user',name:'New',roles:['super_admin'],limits:{max_chars_request:5000,max_chars_month:200000}};
  else if(path==='/api/dashboard'){
   if(failed){await route.fulfill({status:503,json:{detail:'Service unavailable'}});return;}
   body={series:[],ranking:[],recent:[],recordings:0,active_days:0,usage:{used_chars_month:0}};
  }
  await route.fulfill({json:body});
 });
 await page.goto('/');await expect(page.getByRole('alert')).toContainText('Chưa tải được thống kê');
 failed=false;await page.getByRole('button',{name:'Thử lại',exact:true}).click();
 await expect(page.getByText('Chưa có giọng khả dụng.',{exact:false})).toBeVisible();
 await expect(page.getByRole('alert')).toHaveCount(0);
 await expect(page.locator('.ranking-row')).toHaveCount(0);
});
