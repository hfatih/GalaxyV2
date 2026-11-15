import { useState } from 'react';

const groups = [
  ['Kollar ve disk', [
    ['arms', 'Kol sayısı', 2, 8, 1],
    ['armTwist', 'Kol burulması', 0, 4, 0.1],
    ['armSpread', 'Kol yayılımı', 0.05, 1.2, 0.01],
    ['diskWarp', 'Disk burkulması', 0, 40, 1],
  ]],
  ['Yıldız popülasyonu', [
    ['starCount', 'Disk yıldızları', 20000, 400000, 1000],
    ['bulgeCount', 'Çekirdek yıldızları', 2000, 80000, 1000],
    ['haloCount', 'Halo yıldızları', 2000, 100000, 1000],
  ]],
  ['Görünüm ve hareket', [
    ['starSize', 'Yıldız boyutu', 0.1, 3, 0.1],
    ['rotationSpeed', 'Dönüş hızı', 0, 0.2, 0.005],
  ]],
];

function NumberControl({ field, value, onChange }) {
  const [key, label, min, max, step] = field;
  const [draft, setDraft] = useState(null);
  const id = 'control-' + key;
  const fill = (value - min) / (max - min) * 100 + '%';
  return (
    <div className="number-control">
      <div className="control-label">
        <label htmlFor={id}>{label}</label>
        <input
          className="control-value"
          type="number"
          inputMode={step >= 1 ? 'numeric' : 'decimal'}
          min={min}
          max={max}
          step="any"
          aria-label={label + ' değeri'}
          value={draft ?? value}
          onChange={event => setDraft(event.target.value)}
          onBlur={event => {
            const next = event.currentTarget.valueAsNumber;
            if (Number.isFinite(next) && next !== value) {
              const bounded = Math.min(max, Math.max(min, next));
              onChange(key, step >= 1 ? Math.round(bounded) : bounded);
            }
            setDraft(null);
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              event.currentTarget.value = value;
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      <input
        className="control-slider"
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': fill }}
        onChange={event => onChange(key, event.target.valueAsNumber)}
      />
    </div>
  );
}

export default function Inspector({ controls, onChange, onReset, onClose }) {
  return (
    <aside className="inspector" id="galaxy-settings" aria-labelledby="inspector-title">
      <div className="panel-title inspector-title">
        <h2 id="inspector-title">Galaksi Ayarları</h2>
        <div className="inspector-actions">
          <button className="reset-button" type="button" onClick={onReset}><span aria-hidden="true">↶</span> Sıfırla</button>
          <button className="drawer-close" type="button" onClick={onClose} aria-label="Ayarları kapat">×</button>
        </div>
      </div>
      <div className="inspector-fields">
        {groups.map(([group, fields], index) => (
          <fieldset key={group}>
            <legend><i aria-hidden="true"></i>{group}</legend>
            {fields.map(field => (
              <NumberControl key={field[0]} field={field} value={controls[field[0]]} onChange={onChange} />
            ))}
            {index === groups.length - 1 && (
              <label className="switch-row">
                <span>Toz katmanı</span>
                <input type="checkbox" checked={controls.showDust} onChange={event => onChange('showDust', event.target.checked)} />
              </label>
            )}
          </fieldset>
        ))}
      </div>
    </aside>
  );
}
