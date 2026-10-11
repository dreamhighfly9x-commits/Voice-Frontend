import UseCaseArt, { UseCasePop } from './UseCaseArt';

export function SlideMedia({ slide, variant = 'card', eager = false }) {
  return slide.image
    ? <img src={slide.image} alt={slide.altText} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable="false" />
    : <><UseCaseArt id={slide.id} accent={slide.accent} variant={variant} /><span className="uc-visually-hidden">{slide.altText}</span></>;
}

export const WaveIcon = () => <span className="uc-wave-icon" aria-hidden="true"><i /><i /><i /><i /></span>;

// offset: signed distance from the active slide (0 = center, -1/+1 = neighbours...).
export default function UseCaseSlideCard({ slide, offset, index, total, eager, onSelect, onExpand }) {
  const active = offset === 0;
  const distance = Math.abs(offset);
  return <article
    className={`uc-card ${active ? 'is-active' : distance <= 2 ? 'is-side' : 'is-far'}${slide.popImage ? ' has-cutout' : ''}`}
    data-offset={Math.max(-3, Math.min(3, offset))}
    role="group"
    aria-roledescription="slide"
    aria-label={`${index + 1} / ${total}: ${slide.title}`}
    aria-hidden={!active}
    inert={distance > 2}
    onClick={active ? undefined : () => onSelect(index)}
    style={{ '--accent': slide.accent }}
  >
    <div className="uc-card-cover">
      <div className="uc-card-media"><SlideMedia slide={slide} eager={eager} /></div>
      {active && <>
        <button type="button" className="uc-card-expand" onClick={onExpand}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10V4h6M20 14v6h-6M4 4l6 6M20 20l-6-6" /></svg>Expand</button>
        <span className="uc-card-chip" aria-hidden="true"><WaveIcon /></span>
      </>}
    </div>
    {(slide.popImage || !slide.image) && <div className={slide.popImage ? 'uc-card-pop is-image' : 'uc-card-pop'} aria-hidden="true">{slide.popImage ? <img src={slide.popImage} alt="" loading="lazy" decoding="async" draggable="false" /> : <UseCasePop id={slide.id} accent={slide.accent} />}</div>}
    <div className="uc-card-body">
      <div className="uc-card-title"><h3>{slide.title}</h3>{active && <span>{index + 1} / {total}</span>}</div>
      {active
        ? <><p>{slide.description}</p><span className="uc-card-meta"><WaveIcon />{slide.category}</span></>
        : <span className="uc-card-sub">{slide.category}</span>}
    </div>
  </article>;
}
