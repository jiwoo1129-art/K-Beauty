import { useState } from 'react';
import { mergeChoice } from './productInput.js';

export function SingleChoiceField({ name, label, title, value, options, required, onChange }) {
  const listed = options.includes(value);
  const [custom, setCustom] = useState(Boolean(value && !listed));

  function choose(event) {
    const next = event.target.value;
    setCustom(next === '__custom');
    onChange(name, next === '__custom' ? '' : next);
  }

  return (
    <label className="choice-field">
      <span title={title}>{label}{required && <em>필수</em>}</span>
      <select name={`${name}Choice`} required={required && !custom} value={custom ? '__custom' : listed ? value : ''} onChange={choose}>
        <option value="">선택하세요</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
        <option value="__custom">직접 입력…</option>
      </select>
      {custom && <input name={name} required={required} value={value} onChange={(event) => onChange(name, event.target.value)} placeholder="직접 입력" />}
    </label>
  );
}

export function MultiChoiceField({ name, label, title, value, options, onChange }) {
  const selected = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

  function addCustom(event) {
    if (event.key !== 'Enter') return;
    const choice = event.currentTarget.value.trim();
    if (!choice) return;
    event.preventDefault();
    onChange(name, mergeChoice(value, choice, true));
    event.currentTarget.value = '';
  }

  return (
    <div className="choice-field">
      <span title={title}>{label}</span>
      <details className="choice-menu">
        <summary>{selected.length ? `${selected.length}개 선택됨` : '목록 펼치기'}</summary>
        <div className="choice-options">
          {options.map((option) => (
            <label key={option}>
              <input type="checkbox" checked={selected.includes(option)} onChange={(event) => onChange(name, mergeChoice(value, option, event.target.checked))} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </details>
      <div className="choice-tags">
        {selected.map((item) => <button key={item} type="button" onClick={() => onChange(name, mergeChoice(value, item, false))}>{item} ×</button>)}
      </div>
      <input aria-label={`${label} 직접 입력`} placeholder="직접 입력 후 Enter" onKeyDown={addCustom} />
    </div>
  );
}

