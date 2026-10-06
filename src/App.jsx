import { apiFetch, apiJson } from './lib/authApi';
import { useAuth, usePermission } from './lib/AuthContext';
import AuthScreen from './screens/AuthScreen';
import LoginReveal from './components/LoginReveal';
import LoadingIndicator from './components/LoadingIndicator';
import DreamBotCompanion from './components/DreamBotCompanion';
import {useDreamBot} from './lib/dreamBotActivity';
import { useCallback, useEffect, useRef, useState } from 'react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GlobalSearch from './components/GlobalSearch';
import Toast from './components/Toast';
import HomeScreen from './screens/HomeScreen';
import StudioScreen from './screens/StudioScreen';
import VoicesScreen from './screens/VoicesScreen';
import ClonesScreen from './screens/ClonesScreen';
import { readVoicePreferences } from './lib/voiceFilters';
import { applyDictionary, normalizeText, readDictionary, splitText } from './lib/studioText';
import ScriptScreen from './screens/ScriptScreen';
import BatchScreen from './screens/BatchScreen';
import LibraryScreen from './screens/LibraryScreen';
import SettingsScreen from './screens/SettingsScreen';
import CreditsScreen from './screens/CreditsScreen';
import AdminScreen from './screens/AdminScreen';
import { canOpenPage } from './lib/permissionMatrix';
import ProvidersScreen from './screens/ProvidersScreen';
import { useUiSound } from './lib/useUiSound';
import { defaultOptions } from './lib/voiceControls';
import {
  INITIAL_TEXT,
  QUOTA_LIMIT_DEFAULT,
} from './data';

const activeEngine = { name: 'VieNeu v3 Turbo', prefix: '', maxChars: 5000 };

export default function App(props) {
  const { status, user } = useAuth();
  const [loginSnapshot, setLoginSnapshot] = useState(null);
  const finishReveal = useCallback(() => setLoginSnapshot(null), []);
  const prepareReveal = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const source = document.querySelector('.voice-auth');
    if (!source) return;
    const snapshot = source.cloneNode(true);
    snapshot.querySelectorAll('input').forEach(input => { input.value = ''; input.removeAttribute('value'); });
    snapshot.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    setLoginSnapshot({ node: snapshot, width: window.innerWidth, scrollY: window.scrollY });
  };
  if (status === 'checking') return <LoadingIndicator fullScreen label="Đang kiểm tra đăng nhập…" />;
  if (status !== 'authenticated') return <AuthScreen onLoginStart={prepareReveal} onLoginFailure={finishReveal} subtitle="Đăng nhập để truy cập giọng và bản ghi của bạn." />;
  return <><AuthenticatedApp key={user.id} {...props} />{loginSnapshot && <LoginReveal snapshot={loginSnapshot} onComplete={finishReveal} />}</>;
}

function AuthenticatedApp({
  defaultScreen = 'home',
  theme: initialTheme = 'light',
  sound: initialSound = true,
  charLimit = QUOTA_LIMIT_DEFAULT,
}) {
  const { can } = usePermission();
  const { user } = useAuth();
  const [screen, setScreen] = useState(defaultScreen);
  const pageAllowed = canOpenPage(screen, can);
  useEffect(() => { if (!pageAllowed) setScreen('home'); }, [pageAllowed]);
  const [projects,setProjects]=useState([]);
  const [openScriptId,setOpenScriptId]=useState(null);
  const scriptOpened=useCallback(()=>setOpenScriptId(null),[]);
  useEffect(()=>{let active=true;apiJson('/api/scripts').then(data=>{if(active&&Array.isArray(data))setProjects(data);}).catch(()=>{});return()=>{active=false;};},[screen]);
  const [animFlip, setAnimFlip] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { const saved = localStorage.getItem('dreamhigh-theme'); return ['light','dark'].includes(saved) ? saved : initialTheme; }
    catch { return initialTheme; }
  });
  const [sound, setSound] = useState(initialSound !== false);
  const [toast, setToast] = useState('');
  const [toastKind, setToastKind] = useState({ id: 0, success: false });

  const [text, setText] = useState(INITIAL_TEXT);
  const [dictionary, setDictionary] = useState(() => readDictionary(user.id));
  const [undoText, setUndoText] = useState(null);
  const maxChars = Math.min(activeEngine.maxChars, user.limits?.max_chars_request ?? 5000);
  const effectiveText = applyDictionary(text, dictionary);
  const replaceText = (next) => { setUndoText(text); setText(next); };
  const [voice, setVoice] = useState('');
  const [optState, setOptState] = useState({ voice: null, values: {} });
  const [engineVoices, setEngineVoices] = useState([]);
  // Provider-voice controls, derived (not an effect) so switching voice resets cleanly.
  const voiceControls = engineVoices.find((v) => v.id === voice)?.controls || [];
  const voiceOptions = optState.voice === voice ? optState.values : defaultOptions(voiceControls);
  const setVoiceOption = (name, value) => setOptState(current => ({ voice, values: { ...(current.voice===voice?current.values:defaultOptions(voiceControls)), [name]: value } }));
  const [engineStatus, setEngineStatus] = useState('Đang kết nối VieNeu v3 Turbo…');
  const [engineReady, setEngineReady] = useState(false);
  const [playing, setPlaying] = useState(null);
  const bot = useDreamBot(Boolean(playing));
  const [previewLoading,setPreviewLoading]=useState(null);
  const playbackSequence=useRef(0), previewRequests=useRef(new Map()), previewBlobs=useRef(new Map()), audioUrl=useRef(null);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState([]);

  const [favs, setFavs] = useState(() => readVoicePreferences('voice-favorites'));
  const [voiceCategories, setVoiceCategories] = useState(() => readVoicePreferences('voice-categories'));
  useEffect(() => { try { localStorage.setItem('voice-favorites', JSON.stringify(favs)); } catch { /* Storage unavailable. */ } }, [favs]);
  useEffect(() => { try { localStorage.setItem('voice-categories', JSON.stringify(voiceCategories)); } catch { /* Storage unavailable. */ } }, [voiceCategories]);
  const [voiceFilter, setVoiceFilter] = useState('Tất cả');
  const [libFilter, setLibFilter] = useState('Tất cả');



  const audioRef = useRef(null);
  const requestBusy = useRef(false);
  const toastTimer = useRef(null);


  const { ping } = useUiSound(sound);

  // ── theme ──
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('dreamhigh-theme', theme); } catch { /* Storage may be disabled. */ }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const toggleSound = () => {
    setSound((s) => {
      const on = !s;
      if (on) setTimeout(() => ping(1320, 0.08, 0.05, 'sine'), 20);
      return on;
    });
  };

  const go = (id) => {
    if (!canOpenPage(id, can)) { showToast('Bạn chưa được cấp quyền mở trang này.'); return; }
    setScreen(id);
    setAnimFlip((f) => !f);
  };

  const showToast = (msg, ms = 2600, success = false) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    setToastKind((prev) => ({ id: prev.id + 1, success }));
    toastTimer.current = setTimeout(() => setToast(''), ms);
  };

  // ── cleanup on unmount ──
  useEffect(
    () => () => {
      playbackSequence.current++;
      audioRef.current?.pause();
      if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);
      previewBlobs.current.clear();
      clearTimeout(toastTimer.current);
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    let retry;
    const config = activeEngine;
    const connect = async () => {
      try {
        const responses = await Promise.all(['/api/voices', '/api/recordings'].map(
          (url) => apiFetch(config.prefix + url, { signal: controller.signal })
        ));
        if (responses.some((response) => !response.ok)) throw new Error('offline');
        const [voices, recordings] = await Promise.all(responses.map((response) => response.json()));
        if (controller.signal.aborted) return;
        setEngineVoices(voices);
        setVoice((current) => voices.some((v) => v.id === current) ? current : voices[0]?.id || '');
        setResults(recordings.map((r) => ({ ...r, url: config.prefix + r.url })));
        setEngineReady(voices.length > 0);
        setEngineStatus(config.name + ' · Sẵn sàng');
      } catch {
        if (controller.signal.aborted) return;
        setEngineReady(false);
        setEngineStatus('Chưa kết nối được ' + config.name + '. Đang thử lại…');
        retry = setTimeout(connect, 5000);
      }
    };
    connect();
    return () => { controller.abort(); clearTimeout(retry); };
  }, []);

  // Re-fetch the voice library when a provider is connected/synced/toggled elsewhere,
  // so external voices appear without a full page reload (ProvidersScreen dispatches it).
  useEffect(() => {
    const refetch = async () => {
      try {
        const response = await apiFetch('/api/voices');
        if (!response.ok) return;
        const voices = await response.json();
        setEngineVoices(voices);
        setVoice((current) => voices.some((v) => v.id === current) ? current : (voices[0]?.id || ''));
        setEngineReady(voices.length > 0);
      } catch { /* keep current list on failure */ }
    };
    window.addEventListener('voices-changed', refetch);
    return () => window.removeEventListener('voices-changed', refetch);
  }, []);

  const playAudio = async (recording, id = recording.id, sequence = ++playbackSequence.current) => {
    audioRef.current?.pause();
    if(audioUrl.current){URL.revokeObjectURL(audioUrl.current);audioUrl.current=null;}
    if (playing === id) { setPlaying(null); return; }
    setPlaying(null);
    const isPreview=id.startsWith('v');
    let blob=isPreview?previewBlobs.current.get(recording.id):null;
    if(!blob){
      let response;
      try { response = await apiFetch(recording.url); } catch { if(sequence===playbackSequence.current)showToast('Không tải được âm thanh.'); return; }
      if (!response.ok) { if(sequence===playbackSequence.current)showToast('Không được phép nghe bản ghi này.'); return; }
      blob=await response.blob();
      if(sequence!==playbackSequence.current)return;
      if(isPreview){previewBlobs.current.set(recording.id,blob);if(previewBlobs.current.size>20)previewBlobs.current.delete(previewBlobs.current.keys().next().value);}
    }
    if(sequence!==playbackSequence.current)return;
    const source=URL.createObjectURL(blob),audio=new Audio(source);audioUrl.current=source;audioRef.current=audio;
    const cleanup=()=>{URL.revokeObjectURL(source);if(audioUrl.current===source)audioUrl.current=null;};
    audio.onplaying=()=>{if(sequence===playbackSequence.current)setPlaying(id);};
    audio.onpause=audio.onwaiting=()=>{if(sequence===playbackSequence.current)setPlaying(null);};
    audio.onended=()=>{if(sequence===playbackSequence.current)setPlaying(null);cleanup();};
    audio.onerror=()=>{if(sequence===playbackSequence.current){setPlaying(null);showToast('Không phát được bản ghi.');}cleanup();};
    try {
      await audio.play();if(sequence!==playbackSequence.current){audio.pause();cleanup();return;}setPlaying(id);
      if (/^[0-9a-f]{32}$/.test(recording.id)) apiJson('/api/dashboard/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({recording:recording.id,action:'listen'})}).catch(()=>{});
    } catch {cleanup();if(sequence===playbackSequence.current){setPlaying(null);showToast('Bấm phát để nghe bản ghi.');}}
  };

  const deleteRecording = async (id) => {
    // Invalidate pending playback too, so a deleted take cannot start later.
    playbackSequence.current++;
    audioRef.current?.pause();
    setPlaying(null);
    if (audioUrl.current) { URL.revokeObjectURL(audioUrl.current); audioUrl.current = null; }
    try {
      const response = await apiFetch('/api/recordings/' + encodeURIComponent(id), { method: 'DELETE' });
      if (!response.ok) {
        const detail = await response.json().catch(()=>({}));
        throw new Error(detail.detail || 'Không xóa được bản ghi.');
      }
      previewBlobs.current.delete(id);
      setResults(items => items.filter(item => item.id !== id));
      showToast('Đã xóa bản ghi.');
    } catch (error) { showToast(error.message); }
  };

  const generate = async (content = text, selectedVoice = voice, autoplay = false, playbackId, preview = false) => {
    if (requestBusy.current) return;
    if (!can('tts.create')) { showToast('Bạn chưa được cấp quyền tạo âm thanh.'); return; }
    if (!engineReady) { showToast('Engine chưa sẵn sàng.'); return; }
    content = applyDictionary(content, dictionary).trim();
    if (preview) content = splitText(content, Math.min(300, maxChars))[0] || '';
    if (!content || content.length > maxChars) {
      showToast(`Nhập từ 1 đến ${maxChars.toLocaleString('vi-VN')} ký tự sau khi áp dụng từ điển cho mỗi lần tạo.`); return;
    }
    requestBusy.current = true;
    setGenerating(true);
    try {
      const body = { text: content, voice: selectedVoice };
      if ((selectedVoice.startsWith('prov:') || selectedVoice.startsWith('ext_')) && Object.keys(voiceOptions).length) body.options = voiceOptions;
      const response = await apiFetch(activeEngine.prefix + '/api/synthesize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.detail === 'string' ? result.detail : 'Không tạo được âm thanh. Kiểm tra kết nối engine.');
      result.url = activeEngine.prefix + result.url;
      setResults((list) => [result, ...list]);
      showToast('Đã tạo và lưu bản ghi WAV.', 3200, true);
      if (autoplay) await playAudio(result, playbackId || result.id);
      return result;
    } catch (error) { showToast(error.message, 6000); }
    finally { requestBusy.current = false; setGenerating(false); }
  };

  const play = (id) => {
    const recording = results.find((r) => r.id === id);
    if (recording) {setPreviewLoading(null);return playAudio(recording);}
    const preset = engineVoices.find((v) => 'v' + v.id === id);
    if (preset) {
      const sequence=++playbackSequence.current;
      audioRef.current?.pause();
      if (playing === id || previewLoading===id) {setPlaying(null);setPreviewLoading(null);return;}
      if(!can('tts.create')){showToast('Bạn chưa được cấp quyền nghe thử tạo giọng.');return;}
      setPlaying(null);setPreviewLoading(id);
      let request=previewRequests.current.get(preset.id);
      if(!request){
        request=apiJson('/api/voice-preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({voice:preset.id})}).finally(()=>previewRequests.current.delete(preset.id));
        previewRequests.current.set(preset.id,request);
      }
      return request.then(async result=>{
        if(sequence!==playbackSequence.current)return;
        setResults(list=>list.some(r=>r.id===result.id)?list:[result,...list]);
        await playAudio(result,id,sequence);
      }).catch(error=>{if(sequence===playbackSequence.current)showToast(error.message,6000);})
        .finally(()=>{if(sequence===playbackSequence.current)setPreviewLoading(null);});
    }
    showToast('Mục này chưa có bản ghi âm thanh.');
  };

  // ── derived view data ──
  const voiceData = engineVoices.map((v) => ({ ...v, ...voiceCategories[v.id] }));
  const selectedVoice = voiceData.find((v) => v.id === voice);
  const quickVoices = selectedVoice ? [selectedVoice, ...voiceData.filter((v) => v.id !== voice).slice(0, 2)] : voiceData.slice(0, 3);
  const searchIndex = [
    ...voiceData.map((v) => ({ key: 'voice:' + v.id, id: v.id, kind: 'Giọng', title: v.name, detail: v.desc, keywords: [v.tags, v.gender === 'female' ? 'nữ' : v.gender === 'male' ? 'nam' : '', v.style === 'doc_truyen' ? 'kể chuyện' : v.style === 'quang_cao' ? 'quảng cáo' : ''].join(' ') })),
    ...results.map((r) => ({ key: 'recording:' + r.id, id: r.id, kind: 'Bản ghi', title: r.title, detail: r.meta, url: r.url })),
    ...projects.map((p) => ({ key: 'project:' + p.id, id: p.id, kind: 'Dự án', title: p.name, detail: p.segments + ' đoạn thoại' })),
  ];

  const chars = text.length;
  const segCount = text.split(/\n\s*\n/).filter((t) => t.trim()).length;
  const charLabel = `${chars.toLocaleString('vi-VN')} / ${maxChars.toLocaleString('vi-VN')} ký tự`;
  const estDuration = `${Math.max(1, Math.round(effectiveText.length / 15))} giây`;
  const segmentCountLabel = `${segCount} đoạn văn bản`;
  const queueLabel = !can('tts.create') ? 'Tài khoản chưa được cấp quyền tạo âm thanh' : generating ? 'Đang tạo bản ghi' : engineStatus;

  const animStyle = { animation: `${animFlip ? 'fadeUpA' : 'fadeUpB'} .34s cubic-bezier(.2,.8,.3,1) both` };


  return (
    <div className="app-shell">
      <Sidebar screen={screen} onNavigate={go} charLimit={charLimit} />

      <main className="app-main">
        <Toast key={toastKind.id} message={toast} success={toastKind.success} />

        <Header
          search={<GlobalSearch items={searchIndex} ready={engineReady} playingId={playing} onPlay={play} onChoose={(item) => {
            if (item.kind === 'Giọng') { setVoice(item.id); go('studio'); }
            else if (item.kind === 'Bản ghi') { setLibFilter('Tất cả'); go('library'); play(item.id); }
            else { setOpenScriptId(item.id); go('script'); }
          }} />}
          onAccount={() => go('settings')}
          screen={screen}
          theme={theme}
          sound={sound}
          onToggleTheme={toggleTheme}
          onToggleSound={toggleSound}
          onNewProject={() => go('studio')}
        />

        {screen !== 'home' && <DreamBotCompanion bot={bot} screen={screen}/>}

        {screen === 'studio' && (
          <StudioScreen
            modelName={voice.startsWith('qwen06:')?'Qwen3-TTS 0.6B':voice.startsWith('qwen17:')?'Qwen3-TTS 1.7B':activeEngine.name}
            voiceLanguage={voice.startsWith('qwen')?'Đa ngôn ngữ (không có tiếng Việt)':'Tiếng Việt'}
            maxChars={maxChars}
            dictionary={dictionary}
            onDictionary={setDictionary}
            userId={user.id}
            onReplace={replaceText}
            canUndo={undoText !== null}
            onUndo={() => { if (undoText !== null) { setText(undoText); setUndoText(null); } }}
            effectiveChars={effectiveText.trim().length}
            animStyle={animStyle}
            text={text}
            onText={(e) => { setText(e.target.value); setUndoText(null); }}
            onNormalize={() => { replaceText(normalizeText(text)); showToast('Đã chuẩn hóa khoảng trắng và xuống dòng.'); }}
            onAutoSplit={() => { const parts = splitText(text, Math.min(600, maxChars)); replaceText(parts.join('\n\n')); showToast(`Đã chia thành ${parts.length} đoạn trong ô văn bản.`); }}
            charLabel={charLabel}
            estDuration={estDuration}
            segmentCountLabel={segmentCountLabel}
            onPreview={() => generate(text, voice, true, undefined, true)}
            onGenerate={() => generate()}
            generating={generating}
            engineReady={engineReady && can('tts.create')}
            results={results}
            playingId={playing}
            onPlay={play}
            onDelete={deleteRecording}
            quickVoices={quickVoices}
            voices={voiceData}
            voice={voice}
            onPickVoice={setVoice}
            onGoVoices={() => go('voices')}
            queueLabel={queueLabel}
            voiceControls={voiceControls}
            voiceOptions={voiceOptions}
            onVoiceOption={setVoiceOption}
          />
        )}

        {screen === 'home' && <HomeScreen bot={bot} favorites={favs} voices={voiceData} recordings={results} playingId={playing} generating={generating} onPlay={play} onPick={(id)=>{setVoice(id);go('studio');}} onNavigate={go} engineReady={engineReady} />}

        {screen === 'voices' && (
          <VoicesScreen
            previewLoading={previewLoading}
            animStyle={animStyle}
            voices={voiceData}
            voiceFilter={voiceFilter}
            onClassify={(id, category) => setVoiceCategories((current) => ({ ...current, [id]: { ...current[id], ...category } }))}
            onFilter={setVoiceFilter}
            playingId={playing}
            onPlay={play}
            favs={favs}
            onFav={(id) => setFavs((f) => ({ ...f, [id]: !f[id] }))}
            voice={voice}
            onPick={(id) => {
              setVoice(id);
              go('studio');
            }}
          />
        )}

        {screen === 'clones' && (
          <ClonesScreen
            animStyle={animStyle}
            clones={engineVoices.filter((v) => v.id.startsWith('clone_'))}
            busy={generating}
            onPlay={(id) => play('v' + id)}
            onPick={(id) => { setVoice(id); go('studio'); }}
            onCreated={(v) => { setEngineVoices((list) => [...list, v]); setVoice(v.id); }}
            onRenamed={(v) => setEngineVoices((list) => list.map((item) => item.id === v.id ? v : item))}
            onDeleted={(id) => {
              setEngineVoices((list) => list.filter((v) => v.id !== id));
              setVoice((current) => current === id ? engineVoices.find((v) => v.id !== id)?.id || '' : current);
              if (playing === 'v' + id) { audioRef.current?.pause(); setPlaying(null); }
              setFavs((list) => { const next = { ...list }; delete next[id]; return next; });
            }}
          />
        )}

        {screen === 'script' && (
          <ScriptScreen
            openId={openScriptId}
            onOpened={scriptOpened}
            voices={voiceData}
            voicesReady={engineReady}
            voiceStatus={engineStatus}
            maxChars={maxChars}
            onCreated={(result) => setResults((list) => [result, ...list])}
            playingId={playing}
            onPlay={play}
          />
        )}


        {screen === 'batch' && (
          <BatchScreen
            animStyle={animStyle}
            voices={voiceData}
            maxChars={Math.min(activeEngine.maxChars, user.limits?.max_chars_request || 5000)}
            onCreated={(result) => setResults((list) => [result, ...list])}
            playingId={playing}
            onPlay={play}
          />
        )}

        {screen === 'library' && (
          <LibraryScreen
            onDelete={deleteRecording}
            animStyle={animStyle}
            items={results}
            libFilter={libFilter}
            onFilter={setLibFilter}
            playingId={playing}
            onPlay={play}
          />
        )}

        {screen === 'settings' && <SettingsScreen animStyle={animStyle} />}
        {screen === 'credits' && <CreditsScreen animStyle={animStyle} />}
        {screen === 'providers' && <ProvidersScreen animStyle={animStyle} />}
        {screen === 'admin' && <AdminScreen animStyle={animStyle} />}
      </main>


    </div>
  );
}
