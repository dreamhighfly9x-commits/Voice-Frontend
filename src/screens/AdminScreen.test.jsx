import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render,screen,waitFor,within } from '../testRender';
import userEvent from '@testing-library/user-event';
import AdminScreen from './AdminScreen';
import RolesPanel from './RolesPanel';
import CreateEmployee from './CreateEmployee';
import { AuthContext } from '../lib/AuthContext';
import { apiJson } from '../lib/authApi';
vi.mock('../lib/authApi',()=>({apiJson:vi.fn()}));
const roles=[{id:1,key:'admin',name:'Admin',permissions:['tts.create','clones.create'],user_count:1,is_system:true,locked:true},{id:3,key:'user',name:'User',permissions:['tts.create'],user_count:1,is_system:true,locked:false}];
const account={id:'member',email:'member@example.invalid',name:'Thành viên',roles:['user'],overrides:{},is_suspended:false,max_chars_month:100000,max_chars_request:5000,max_concurrent_jobs:1,max_clones:5,max_storage_mb:1024};
beforeEach(()=>{apiJson.mockReset();apiJson.mockImplementation(async(path)=>{
 if(path==='/api/admin/users') return [account];
 if(path==='/api/admin/permissions')return [{key:'tts.create',roles:['user','admin']},{key:'clones.create',roles:['user','admin']}];
 if(path==='/api/admin/roles')return roles;
 if(path.startsWith('/api/local-usage'))return {used_chars_month:12,clones:1,storage_bytes:100};
 return {message:'ok'};
});});
describe('Admin permissions',()=>{
 it('preserves employee data when roles fail and reloads roles on retry',async()=>{
  const original=apiJson.getMockImplementation();
  let unavailable=true;
  apiJson.mockImplementation((path,...args)=>{
   if(path==='/api/admin/roles'&&unavailable)return Promise.reject(new Error('404'));
   return original(path,...args);
  });
  const user=userEvent.setup();render(<AdminScreen/>);
  expect(await screen.findByRole('button',{name:/Thành viên/})).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('Không tải được danh sách vai trò');
  expect(screen.getByRole('button',{name:'+ Thêm nhân viên'})).toBeDisabled();
  unavailable=false;
  await user.click(screen.getByRole('button',{name:'Tải lại vai trò'}));
  await waitFor(()=>expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  await user.click(screen.getByRole('button',{name:'+ Thêm nhân viên'}));
  await user.selectOptions(screen.getByLabelText('Vai trò'),'admin');
  expect(screen.getByLabelText('Vai trò')).toHaveValue('admin');
 });
 it('does not grant an action when its page permission exceeds the actor permissions',async()=>{
  const user=userEvent.setup();
  render(<AuthContext.Provider value={{user:{id:'limited',roles:['manager'],permissions:['roles.manage','projects.delete']}}}><RolesPanel roles={[]} catalog={['projects.read','projects.delete'].map(key=>({key}))} onChanged={vi.fn()}/></AuthContext.Provider>);
  await user.click(screen.getByRole('button',{name:'+ Tạo vai trò'}));
  expect(screen.getByLabelText('Dự án: Xóa')).toBeDisabled();
  await user.click(screen.getByLabelText('Toàn bộ Dự án'));
  expect(screen.getByLabelText('Dự án: Xóa')).not.toBeChecked();
  expect(screen.getByLabelText('Dự án: Truy cập')).not.toBeChecked();
 });
 it('filters matrix rows without losing previously selected permissions',async()=>{
  const user=userEvent.setup();
  render(<AuthContext.Provider value={{user:{id:'owner',roles:['super_admin'],permissions:[]}}}><RolesPanel roles={[]} catalog={['tts.create','projects.read','projects.delete'].map(key=>({key}))} onChanged={vi.fn()}/></AuthContext.Provider>);
  await user.click(screen.getByRole('button',{name:'+ Tạo vai trò'}));
  await user.click(screen.getByLabelText('Dự án: Xóa'));
  await user.type(screen.getByLabelText('Tìm trang trong ma trận'),'chuyen van ban');
  expect(screen.queryByLabelText('Dự án: Xóa')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Chuyển văn bản: Truy cập')).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Tìm trang trong ma trận'));
  expect(screen.getByLabelText('Dự án: Xóa')).toBeChecked();
  expect(screen.getByLabelText('Dự án: Truy cập')).toBeChecked();
 });
 it('only offers grantable roles and previews employee access',()=>{
  render(<AuthContext.Provider value={{user:{id:'limited',roles:['manager'],permissions:['users.update','tts.create']}}}><CreateEmployee roles={roles} onCreated={vi.fn()} onCancel={vi.fn()}/></AuthContext.Provider>);
  expect(screen.queryByRole('option',{name:'Admin'})).not.toBeInTheDocument();
  expect(screen.getByLabelText('Vai trò')).toHaveValue('user');
  expect(within(screen.getByLabelText('Quyền của nhân viên')).getByText('Chuyển văn bản')).toBeInTheDocument();
  expect(screen.getByLabelText('Mật khẩu ban đầu')).toHaveAttribute('type','password');
 });
 it('retains employee input after an API error and allows retry',async()=>{
  apiJson.mockRejectedValueOnce(new Error('Email đã tồn tại'));
  const user=userEvent.setup(),created=vi.fn();
  render(<CreateEmployee roles={roles} onCreated={created} onCancel={vi.fn()}/>);
  await user.type(screen.getByLabelText('Email'),'nv@example.invalid');
  await user.click(screen.getByRole('button',{name:'Tạo ngẫu nhiên'}));
  await user.click(screen.getByRole('button',{name:'Tạo tài khoản'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Email đã tồn tại');
  expect(screen.getByLabelText('Email')).toHaveValue('nv@example.invalid');
  expect(created).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button',{name:'Tạo tài khoản'}));
  await waitFor(()=>expect(created).toHaveBeenCalledTimes(1));
 });
 it('saves explicit denial and quota for selected account',async()=>{
  const user=userEvent.setup();render(<AdminScreen/>);
  await user.click(await screen.findByRole('button',{name:/Thành viên/}));
  await user.selectOptions(screen.getByLabelText('Tạo âm thanh'),'false');
  await user.clear(screen.getByLabelText('Giọng clone tối đa'));await user.type(screen.getByLabelText('Giọng clone tối đa'),'2');
  await user.click(screen.getByRole('button',{name:'Lưu quyền & hạn mức'}));
  await waitFor(()=>expect(apiJson).toHaveBeenCalledWith('/api/admin/users/member',expect.objectContaining({method:'PATCH'})));
  const body=JSON.parse(apiJson.mock.calls.find(([path])=>path==='/api/admin/users/member')[1].body);
  expect(body.overrides['tts.create']).toBe(false);expect(body.max_clones).toBe(2);
 });
 it('shows backend errors and warnings and filters them',async()=>{
  const logs=[
   {timestamp:'2026-09-29T12:00:02Z',level:'error',message:'synthesis_failed',service:'tts-api',request_id:'req-aaaa1111',caller:'main.py:398',error:{type:'RuntimeError',message:'engine down',stack:'Traceback…'}},
   {timestamp:'2026-09-29T12:00:01Z',level:'warn',message:'http_request',service:'auth-api',request_id:'req-bbbb2222',method:'GET',path:'/api/me',status:503},
  ];
  apiJson.mockImplementation(async(path)=>{
   if(path==='/api/admin/users')return [account];
   if(path==='/api/admin/permissions')return [];
   if(path.startsWith('/api/admin/logs'))return {entries:path.includes('level=error')?logs.slice(0,1):logs};
   return {};
  });
  const user=userEvent.setup();render(<AdminScreen/>);
  await user.click(await screen.findByRole('button',{name:'Lỗi & cảnh báo'}));
  expect(await screen.findAllByTestId('log-entry')).toHaveLength(2);
  expect(screen.getByText('engine down')).toBeInTheDocument();
  expect(screen.getByText('GET /api/me → 503')).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'request req-bbbb2222'}));
  expect(screen.getByLabelText('Tìm trong nhật ký')).toHaveValue('req-bbbb2222');
  expect(screen.getAllByTestId('log-entry')).toHaveLength(1);
  await user.clear(screen.getByLabelText('Tìm trong nhật ký'));
  await user.selectOptions(screen.getByLabelText('Lọc mức độ'),'error');
  await waitFor(()=>expect(apiJson).toHaveBeenCalledWith(expect.stringContaining('level=error')));
  await waitFor(()=>expect(screen.getAllByTestId('log-entry')).toHaveLength(1));
 });
 it('creates an employee with a chosen role and generated password',async()=>{
  const user=userEvent.setup();render(<AdminScreen/>);
  await screen.findByRole('button',{name:/Thành viên/});
  await user.click(screen.getByRole('button',{name:'+ Thêm nhân viên'}));
  await user.type(screen.getByLabelText('Email'),'nv@example.invalid');
  await user.selectOptions(screen.getByLabelText('Vai trò'),'admin');
  await user.click(screen.getByRole('button',{name:'Tạo ngẫu nhiên'}));
  await user.click(screen.getByRole('button',{name:'Tạo tài khoản'}));
  await waitFor(()=>expect(apiJson).toHaveBeenCalledWith('/api/admin/users',expect.objectContaining({method:'POST'})));
  const body=JSON.parse(apiJson.mock.calls.find(([path,o])=>path==='/api/admin/users'&&o?.method==='POST')[1].body);
  expect(body.role).toBe('admin');expect(body.password.length).toBeGreaterThanOrEqual(12);
 });
 it('builds a role from the page matrix; actions imply page access',async()=>{
  const user=userEvent.setup();render(<AdminScreen/>);
  await user.click(await screen.findByRole('button',{name:'Vai trò & ma trận quyền'}));
  await user.click(screen.getByRole('button',{name:'+ Tạo vai trò'}));
  await user.type(screen.getByLabelText('Tên vai trò'),'Biên tập viên');
  expect(screen.getByLabelText('Mã (tự sinh)')).toHaveValue('bien_tap_vien');
  await user.click(screen.getByLabelText('Chuyển văn bản: Truy cập'));
  await user.click(screen.getByRole('button',{name:'Tạo vai trò'}));
  await waitFor(()=>expect(apiJson).toHaveBeenCalledWith('/api/admin/roles',expect.objectContaining({method:'POST'})));
  const body=JSON.parse(apiJson.mock.calls.find(([path,o])=>path==='/api/admin/roles'&&o?.method==='POST')[1].body);
  expect(body).toMatchObject({key:'bien_tap_vien',name:'Biên tập viên',permissions:['tts.create']});
 });
 it('keeps the admin role read-only',async()=>{
  const user=userEvent.setup();render(<AdminScreen/>);
  await user.click(await screen.findByRole('button',{name:'Vai trò & ma trận quyền'}));
  await user.click(screen.getByText('Admin',{selector:'strong'}));
  expect(screen.getByLabelText('Chuyển văn bản: Truy cập')).toBeDisabled();
  expect(screen.queryByRole('button',{name:'Lưu vai trò'})).not.toBeInTheDocument();
 });
 it('blocks ordinary user from viewing or loading admin data',()=>{
  apiJson.mockClear();render(<AuthContext.Provider value={{user:{id:'u',roles:['user'],permissions:[]}}}><AdminScreen/></AuthContext.Provider>);
  expect(screen.getByText('Không có quyền quản trị')).toBeInTheDocument();expect(apiJson).not.toHaveBeenCalled();
 });
});
