import { useState } from 'react';

interface TagInputProps {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}

export default function TagInput({ values, onChange, placeholder }: TagInputProps) {
  const [raw, setRaw] = useState('');

  const commit = () => {
    const v = raw.trim().replace(/,$/, '');
    if (v && !values.includes(v)) onChange([...values, v]);
    setRaw('');
  };

  return (
    <div
      className="tag-input-wrap"
      onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}
    >
      {values.map((v, i) => (
        <span key={i} className="tag-chip">
          {v}
          <button
            className="tag-chip-x"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="tag-bare-input"
        value={raw}
        placeholder={values.length ? '' : placeholder}
        onChange={e => setRaw(e.target.value)}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ',') && raw.trim()) {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Backspace' && !raw && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => { if (raw.trim()) commit(); }}
      />
    </div>
  );
}
