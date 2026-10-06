import {act,renderHook} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {beginVoiceTask,updateVoiceTask,endVoiceTask,resetVoiceTasks,useDreamBot,chooseBotState} from './dreamBotActivity';

beforeEach(()=>{vi.useFakeTimers();sessionStorage.clear();resetVoiceTasks();});
afterEach(()=>{resetVoiceTasks();vi.useRealTimers();});
it('success expires into playing; failure and incomplete files never celebrate',()=>{
 const {result,rerender}=renderHook(({playing})=>useDreamBot(playing),{initialProps:{playing:false}});
 expect(result.current.state).toBe('welcome');
 act(()=>{beginVoiceTask('a');updateVoiceTask('a','queued');});expect(result.current.phase).toBe('queued');
 act(()=>updateVoiceTask('a','generating'));expect(result.current.state).toBe('generating');
 rerender({playing:true});expect(result.current.state).toBe('playing');
 act(()=>endVoiceTask('a',{id:'one',url:'/api/media/one.wav'}));expect(result.current.state).toBe('success');
 act(()=>vi.advanceTimersByTime(2700));expect(result.current.state).toBe('playing');
 rerender({playing:false});expect(result.current.state).toBe('idle');
 act(()=>{beginVoiceTask('b');endVoiceTask('b',null);});expect(result.current.state).toBe('idle');
 act(()=>{beginVoiceTask('c');endVoiceTask('c',{id:'no-file'});});expect(result.current.state).toBe('idle');
});
it('welcome does not repeat on remount within a browser session',()=>{
 const first=renderHook(()=>useDreamBot());act(()=>vi.advanceTimersByTime(2700));first.unmount();
 const second=renderHook(()=>useDreamBot());expect(second.result.current.state).toBe('idle');
});
it('playing takes priority over work, which takes priority over welcome',()=>{
 expect(chooseBotState({success:false,playing:true,phase:'queued',welcome:true})).toBe('playing');
 expect(chooseBotState({success:false,playing:false,phase:'queued',welcome:true})).toBe('generating');
});
