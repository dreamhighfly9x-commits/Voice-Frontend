import './WaveInput.css';

export default function WaveInput({ id, label, children, ...inputProps }) {
  return (
    <div className={`voice-wave-field${children ? ' voice-wave-field--action' : ''}`}>
      <input {...inputProps} id={id} placeholder=" " aria-label={label} />
      <label htmlFor={id} aria-label={label}>
        {Array.from(label).map((letter, index) => (
          <span key={index} aria-hidden="true" style={{ transitionDelay: `${index * 35}ms` }}>
            {letter === ' ' ? '\u00a0' : letter}
          </span>
        ))}
      </label>
      {children}
    </div>
  );
}
