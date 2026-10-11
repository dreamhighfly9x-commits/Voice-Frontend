# Public landing page

Unauthenticated `/` renders the public landing immediately, including while the session check is pending. `/login` and `/register` use the existing AuthScreen. `/docs/api` has a public reference; the authenticated API screen still manages keys. `/welcome` always opens the public landing for preview.

The landing never fetches account balances, recordings, voices or keys. AuthProvider may attempt its normal session refresh. Sample playback uses only dedicated files in `public/audio/`. Creating speech requires login; the text is saved in sessionStorage and restored once in Studio. The sample player always plays the published sample text, not edited text.

## Add or replace the intro video

The owner's `video 2.mp4` is installed as `public/video/dreamhigh-intro.mp4` with its audio intact. Its MP4 metadata was moved to the beginning for web playback, without re-encoding. The video sits on the **left of the hero**, alongside the large **Text To Speech** headline. On small screens, the video stacks above the text. It plays on demand using native controls and does not autoplay with sound.

1. Put the video at `public/video/intro.mp4` (or `.webm`).
2. Optionally add a poster image and Vietnamese WebVTT captions in that directory.
3. Edit `public/landing-config.json`:

```json
{
  "introVideo": "/video/dreamhigh-intro.mp4",
  "introPoster": "/video/dreamhigh-intro-poster.jpg",
  "introCaptions": ""
}
```

Leave optional fields empty when unavailable. An empty video field renders the designed coming-soon placeholder. Native video controls support keyboard interaction, mobile playback and captions. Upload the config and assets together when deploying; Vite copies public assets into the build. Only publish media intended for everyone to see.

## Shared brand colors

The public landing now follows the owner's light pearl / pastel blue / lilac reference. Its palette and split video hero live in `src/screens/LandingPastel.css`; the underlying layout remains in `src/screens/LandingPage.css`. It overrides `--brand-*` tokens only inside `.landing-page`. Login / registration retain their existing navy palette in `src/styles/publicBrand.css`.

## Pricing and samples

Prices and plan features come from `src/lib/pricingPlans.js`, shared with the app. No separate invented discounts or visitor account balances are shown. Paid-plan CTAs lead to registration, with a plan hint in the URL; purchases remain in the existing authenticated workflow.

Regenerate the three Vietnamese samples with the backend virtual environment using `scripts/build_landing_samples.py`. These are dedicated VieNeu outputs; private recordings and cloned voices must not be reused as public samples.
