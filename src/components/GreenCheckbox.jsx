import './GreenCheckbox.css';

export default function GreenCheckbox({ className = '', ...input }) {
  return (
    <span className={'dh-check ' + className}>
      <input type="checkbox" {...input} />
      <span className="dh-checkmark" aria-hidden="true" />
    </span>
  );
}
