// Line icons for the slider's indicator bar, keyed by slide id. 24x24, stroke = currentColor.
const PATHS = {
  narration: <><rect x="2.5" y="5" width="13" height="10" rx="2" /><path d="M7.5 8.2v3.6l3-1.8z" fill="currentColor" stroke="none" /><path d="M18.5 7.5c1 .8 1.5 1.6 1.5 2.5s-.5 1.7-1.5 2.5M8 19h4M10 15v4" /></>,
  'movie-review': <><path d="M3 10h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 10l1-4.5 16.5-2L21 7z" /><path d="M8 5l2 4.5M13 4.2l2 4.6M17.5 3.7l1.6 3.9" /></>,
  tiktok: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M13.5 8v5.2a1.8 1.8 0 1 1-1.5-1.8M13.5 8c.4 1 1.2 1.6 2.2 1.7" /><path d="M10.5 18.5h3" /></>,
  youtube: <><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="M10 9v6l5-3z" fill="currentColor" stroke="none" /></>,
  'ai-dubbing': <><rect x="9" y="2.5" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></>,
  podcast: <><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="4.5" height="6.5" rx="1.8" /><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.8" /></>,
  audiobook: <><path d="M12 6.5C10 5 6.5 4.5 3 5.5v13c3.5-1 7-.5 9 1 2-1.5 5.5-2 9-1v-13c-3.5-1-7-.5-9 1z" /><path d="M12 6.5v13" /></>,
  'e-learning': <><path d="M2.5 9.5L12 5l9.5 4.5L12 14z" /><path d="M6.5 11.5v4c3 2.3 8 2.3 11 0v-4M21.5 9.5v5" /></>,
};

export default function UseCaseIcon({ id }) {
  return <svg className="uc-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {PATHS[id] || PATHS['ai-dubbing']}
  </svg>;
}

// Small 4-point sparkle marking the use case as AI-powered.
export const AiSparkle = () => <svg className="uc-ai-sparkle" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M6 0c.4 3 2.6 5.2 6 6-3.4.8-5.6 3-6 6-.4-3-2.6-5.2-6-6 3.4-.8 5.6-3 6-6z" /></svg>;
