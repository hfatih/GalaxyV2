import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Inspector from './Inspector.jsx';
import Scene from './Scene.jsx';
import { formatScale, presets } from './model.js';
import { MAX_AGE, orbitPeriod, profiles } from './physics.js';
import './studio.css';

const integer = new Intl.NumberFormat('tr-TR');
const angleButtons = [['oblique', 'Eğik'], ['top', 'Üst'], ['edge', 'Yan']];
const defaults = key => presets[key].controls ?? presets.milkyWay.controls;
const population = ({ starCount, bulgeCount, haloCount }) => starCount + bulgeCount + haloCount;

function Sources({ dialog, profile }) {
  return (
    <dialog ref={dialog} className="sources" aria-labelledby="sources-title">
      <form method="dialog"><button type="submit" aria-label="Kapat">×</button></form>
      <h2 id="sources-title">Galaksi nasıl değişiyor?</h2>
      <p>Yıldızlar kendi yarıçaplarında dairesel yörüngede ilerler. Dönüş eğrisi disk, merkez şişkinliği ve karanlık madde halosundan hesaplanır. İç disk bir turu daha kısa sürede tamamladığı için başlangıçtaki kollar zamanla sarılır.</p>
      <dl className="orbit-periods">
        {[4, 14].map(radius => (
          <div key={radius}><dt>{radius} kpc yörünge</dt><dd>{integer.format(orbitPeriod(radius, profile))} milyon yıl / tur</dd></div>
        ))}
      </dl>
      <p>Potansiyel sabittir ve yıldızların karşılıklı çekimi hesaba katılmaz. Güneş Sistemi ve Orion Kolu etiketleri Samanyolu referans işaretçileridir.</p>
      <details>
        <summary>Referanslar ve ölçekler</summary>
        <dl>
          {Object.entries(presets).filter(([, preset]) => preset.controls).map(([key, preset]) => (
            <div key={key}><dt>{preset.name}</dt><dd>{formatScale(preset.referenceStars, population(preset.controls))}</dd></div>
          ))}
        </dl>
        <p>Ölçek, referans yıldız nüfusunu seçilen model örneklerine böler. Otomatik kalite çizim sırasında bu örneklerden daha küçük bir alt küme kullanabilir.</p>
      </details>
      <div className="resource-links">
        <a href="https://github.com/hfatih/GalaxyV2/blob/main/README.tr.md#evrim-modeli" target="_blank" rel="noopener">Denklemler ↗</a>
        <a href="https://github.com/hfatih/samanyolu3d" target="_blank" rel="noopener">Samanyolu3D ↗</a>
      </div>
    </dialog>
  );
}

function Timeline({ clock, playing, setPlaying, setTime, seek, evolution, setEvolution, speed }) {
  const [age, showAge] = useState(() => Math.floor(clock.current));
  useEffect(() => {
    showAge(Math.floor(clock.current));
    if (!playing || speed === 0) return;
    const timer = setInterval(() => {
      showAge(Math.floor(clock.current));
      if (clock.current >= MAX_AGE) setPlaying(false);
    }, 100);
    return () => clearInterval(timer);
  }, [clock, playing, seek, setPlaying, speed]);

  function togglePlayback() {
    if (!playing && clock.current >= MAX_AGE) setTime(0);
    setPlaying(!playing);
  }

  return (
    <section className="timeline" aria-label="Simülasyon zamanı">
      <div className="time-top">
        <div className="time-mode" role="group" aria-label="Dönüş modeli">
          <button type="button" aria-pressed={evolution} onClick={() => setEvolution(true)}>Diferansiyel dönüş</button>
          <button type="button" aria-pressed={!evolution} onClick={() => setEvolution(false)}>Sabit biçim</button>
        </div>
        <output id="age" aria-live="off">{integer.format(age)} <span>Myr</span></output>
      </div>
      <div className="time-controls">
        <button type="button" className="motion-button" onClick={togglePlayback} disabled={speed === 0}
          aria-label={playing && speed > 0 ? 'Duraklat' : 'Oynat'} title={speed === 0 ? 'Ayarlar bölümünden dönüş hızını artır' : undefined}>
          <i aria-hidden="true" className={playing && speed > 0 ? 'pause-icon' : 'play-icon'}></i>
        </button>
        <input type="range" className="control-slider" aria-label="Simülasyon zamanı" min="0" max={MAX_AGE}
          step="1" value={age} aria-valuetext={integer.format(age) + ' milyon yıl'}
          style={{ '--fill': age / MAX_AGE * 100 + '%' }}
          onChange={event => {
            const next = event.target.valueAsNumber;
            showAge(next);
            setTime(next);
            setPlaying(false);
          }} />
        <button type="button" className="reset-time" aria-label="Zamanı sıfırla" title="Zamanı sıfırla" onClick={() => setTime(0)}>↺</button>
      </div>
      <div className="time-scale" aria-hidden="true"><span>0</span><span>250</span><span>500</span><span>750</span><span>1.000 Myr</span></div>
    </section>
  );
}

function Studio() {
  const [preset, setPreset] = useState('milkyWay');
  const [controls, setControls] = useState(() => defaults('milkyWay'));
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [showMarkers, setShowMarkers] = useState(true);
  const [view, setView] = useState({ angle: 'oblique' });
  const [evolution, setEvolution] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [seek, setSeek] = useState(0);
  const custom = useRef(defaults('custom'));
  const clock = useRef(0);
  const dialog = useRef(null);
  const viewport = useRef(null);
  const qualityLabel = useRef(null);
  const settingsButton = useRef(null);
  const model = presets[preset];
  const count = population(controls);

  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);

  useEffect(() => {
    if (!showSettings) return;
    const escape = event => {
      if (event.key === 'Escape' && !dialog.current.open) {
        setShowSettings(false);
        settingsButton.current.focus();
      }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [showSettings]);

  function setTime(age) {
    clock.current = age;
    setSeek(value => value + 1);
  }

  function selectModel(next) {
    if (next === preset) return;
    if (preset === 'custom') custom.current = controls;
    setPreset(next);
    setControls(next === 'custom' ? custom.current : defaults(next));
    setTime(0);
  }

  function changeControl(key, value) {
    setControls(current => ({ ...current, [key]: value }));
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreen(Boolean(document.fullscreenElement));
    }
  }

  return (
    <main className="observatory">
      <div className="viewport" ref={viewport} tabIndex={0} aria-label="Üç boyutlu galaksi. Sürükleyerek döndür, fare tekeriyle yakınlaş ve sağ tuşla kaydır.">
        <div className="scene">
          <Scene controls={controls} preset={preset} playing={playing} showMarkers={showMarkers} view={view}
            viewport={viewport} evolution={evolution} clock={clock} qualityLabel={qualityLabel} seek={seek} />
        </div>
      </div>
      <header className="masthead">
        <a href="./" className="brand" aria-label="GalaxyV2 ana görünüm"><i className="brand-mark" aria-hidden="true"></i><span>Galaxy<span>V2</span></span></a>
        <nav className="models" aria-label="Galaksi modelleri">
          {Object.entries(presets).map(([key, item]) => (
            <button type="button" key={key} aria-pressed={key === preset} onClick={() => selectModel(key)}>
              {key === 'custom' ? 'Özel Ayar' : item.name}
            </button>
          ))}
        </nav>
        <div className="header-tools">
          <button type="button" className="physics-button" onClick={() => dialog.current.showModal()}>Fizik</button>
          <button type="button" className="settings-button" ref={settingsButton} aria-expanded={showSettings}
            aria-controls="galaxy-settings" onClick={() => setShowSettings(value => !value)}>
            <i aria-hidden="true">≡</i> Ayarlar
          </button>
        </div>
      </header>
      <div className="scene-title">
        <div className="model-type"><span>{model.catalog}</span>{model.type}</div>
        <h1>{model.name}</h1>
        <div className="scene-metrics"><span><b id="scene-arm-count">{controls.arms}</b> kol</span><span><b id="scene-population">{integer.format(count)}</b> örnek</span></div>
        <p id="star-scale">{formatScale(model.referenceStars, count)}</p>
      </div>
      <div className="viewport-tools">
        <div className="camera-tools" role="group" aria-label="Kamera açısı">
          {angleButtons.map(([angle, label]) => (
            <button type="button" key={angle} onClick={() => setView({ angle })} title={label + ' görünüm'}>{label}</button>
          ))}
        </div>
        <label className="marker-toggle"><input type="checkbox" checked={showMarkers} onChange={event => setShowMarkers(event.target.checked)} /> İşaretçiler</label>
        {document.fullscreenEnabled && <button type="button" className="fullscreen-button" onClick={toggleFullscreen}
          aria-label={fullscreen ? 'Tam ekrandan çık' : 'Tam ekran'} title={fullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}><i aria-hidden="true"></i></button>}
      </div>
      <div className="quality" ref={qualityLabel} aria-label="Çizim kalitesi">Otomatik kalite</div>
      <Timeline clock={clock} playing={playing} setPlaying={setPlaying} setTime={setTime} seek={seek}
        evolution={evolution} setEvolution={setEvolution} speed={controls.rotationSpeed} />
      <div className="settings-drawer" hidden={!showSettings}>
        <Inspector controls={controls} onChange={changeControl} onReset={() => setControls(defaults(preset))}
          onClose={() => { setShowSettings(false); settingsButton.current.focus(); }} />
      </div>
      <Sources dialog={dialog} profile={profiles[preset] ?? profiles.milkyWay} />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Studio />);
