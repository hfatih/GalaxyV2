import { useDeferredValue, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Inspector from './Inspector.jsx';
import Scene from './Scene.jsx';
import { formatScale, presets } from './model.js';
import './studio.css';

const integer = new Intl.NumberFormat('tr-TR');
const angleButtons = [['oblique', 'Eğik'], ['top', 'Üst'], ['edge', 'Yan']];
const defaults = key => presets[key].controls ?? presets.milkyWay.controls;
const population = ({ starCount, bulgeCount, haloCount }) => starCount + bulgeCount + haloCount;

function ModelLibrary({ preset, selectModel, model, count, openSources }) {
  return (
    <aside className="library" aria-label="Galaksi modelleri">
      <div className="panel-title"><h2>Modeller</h2></div>
      <div className="preset-list">
        {Object.entries(presets).map(([key, item]) => (
          <button key={key} className="preset" type="button" aria-pressed={preset === key} onClick={() => selectModel(key)}>
            <i className={'disc-icon ' + key} aria-hidden="true"></i>
            <span><strong>{key === 'custom' ? 'Özel Ayar' : item.name}</strong><small>{key === 'custom' ? 'Kendi modelin' : item.catalog + ' · ' + item.type}</small></span>
            <i className="selection-dot" aria-hidden="true"></i>
          </button>
        ))}
      </div>
      <section className="scale-card" aria-labelledby="scale-title">
        <h3 id="scale-title">Yıldız Ölçeği</h3>
        <p className="scale-value" id="star-scale">{formatScale(model.referenceStars, count)}</p>
        <p>Seçili modelin referans yıldız sayısına göre.</p>
        <button type="button" className="text-button" onClick={openSources}>Referanslar ve ölçekler <span aria-hidden="true">↗</span></button>
      </section>
    </aside>
  );
}

function Sources({ dialog }) {
  return (
    <dialog ref={dialog} className="sources" aria-labelledby="sources-title">
      <form method="dialog"><button type="submit" aria-label="Kapat">×</button></form>
      <h2 id="sources-title">Referanslar ve Ölçekler</h2>
      <p>Hazır modeller, Samanyolu3D’deki yıldız sayısı varsayımlarını kullanır. Ölçek, bu sayıyı diskte, çekirdekte ve haloda gösterilen toplam örneğe böler.</p>
      <dl>
        {Object.entries(presets).filter(([, preset]) => preset.controls).map(([key, preset]) => (
          <div key={key}>
            <dt>{preset.name} <span>{preset.catalog}</span></dt>
            <dd><p>{preset.description}</p><strong>{formatScale(preset.referenceStars, population(preset.controls))}</strong></dd>
          </div>
        ))}
      </dl>
      <p>Özel Ayar, Samanyolu’nun 150 milyar yıldız referansını kullanır. Güneş Sistemi ve Orion Kolu etiketleri Samanyolu referans işaretçileridir.</p>
      <div className="resource-links">
        <a href="https://github.com/hfatih/samanyolu3d/blob/main/README.tr.md#-bilimsel-referanslar-ve-notlar" target="_blank" rel="noopener">Samanyolu3D kaynakları ↗</a>
        <a href="https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/" target="_blank" rel="noopener">Hubble · Andromeda ↗</a>
      </div>
    </dialog>
  );
}

function Studio() {
  const [preset, setPreset] = useState('milkyWay');
  const [controls, setControls] = useState(() => defaults('milkyWay'));
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [showMarkers, setShowMarkers] = useState(true);
  const [view, setView] = useState({ angle: 'oblique' });
  const custom = useRef(defaults('custom'));
  const dialog = useRef(null);
  const viewport = useRef(null);
  const deferred = useDeferredValue(controls);
  const model = presets[preset];
  const count = population(controls);
  const openSources = () => dialog.current.showModal();

  function selectModel(next) {
    if (next === preset) return;
    if (preset === 'custom') custom.current = controls;
    setPreset(next);
    setControls(next === 'custom' ? custom.current : defaults(next));
  }

  function changeControl(key, value) {
    setControls(current => ({ ...current, [key]: value }));
  }

  return (
    <>
      <header className="masthead">
        <a href="./" className="brand" aria-label="GalaxyV2 ana görünüm">
          <i className="brand-mark" aria-hidden="true"></i>
          <span>Galaxy<span>V2</span></span>
        </a>
        <span className="workspace-title">Galaksi Stüdyosu</span>
        <div className="header-actions">
          <button className="sources-button" type="button" onClick={openSources}>Referanslar</button>
          <a className="settings-link" href="#galaxy-settings">Galaksi Ayarları</a>
          <a className="repo-link" href="https://github.com/hfatih/GalaxyV2" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a>
        </div>
      </header>
      <main className="studio">
        <ModelLibrary preset={preset} selectModel={selectModel} model={model} count={count} openSources={openSources} />
        <section className="preview" aria-labelledby="model-title">
          <header className="preview-title">
            <div>
              <div className="model-type"><span>{model.catalog}</span>{model.type}</div>
              <h1 id="model-title">{model.name}</h1>
            </div>
            <dl className="preview-metrics">
              <div><dt>KOLLAR</dt><dd id="scene-arm-count">{controls.arms}</dd></div>
              <div><dt>YILDIZ ÖRNEĞİ</dt><dd id="scene-population">{integer.format(count)}</dd></div>
            </dl>
          </header>
          <div className="viewport" ref={viewport} tabIndex={0} aria-label="Üç boyutlu galaksi. Sürükleyerek döndür, fare tekeriyle yakınlaş ve sağ tuşla kaydır.">
            <div className="sight-grid" aria-hidden="true"></div>
            <div className="scene">
              <Scene controls={deferred} playing={playing} showMarkers={showMarkers} view={view} viewport={viewport} />
            </div>
            <span className="viewport-status"><i aria-hidden="true"></i> 3B ÖNİZLEME</span>
            <div className="camera-tools" role="group" aria-label="Kamera açısı">
              {angleButtons.map(([angle, label]) => (
                <button type="button" key={angle} onClick={() => setView({ angle })} title={label + ' görünüm'}>{label}</button>
              ))}
            </div>
          </div>
          <footer className="preview-footer">
            <button type="button" className="motion-button" onClick={() => setPlaying(value => !value)}>
              <i aria-hidden="true" className={playing ? 'pause-icon' : 'play-icon'}></i>
              {playing ? 'Duraklat' : 'Döndür'}
            </button>
            <label className="marker-toggle"><input type="checkbox" checked={showMarkers} onChange={event => setShowMarkers(event.target.checked)} /> İşaretçiler</label>
            <span className="pointer-hint">Sürükle · Döndür <i></i> Sağ tuş · Kaydır <i></i> Tekerlek · Yakınlaş</span>
          </footer>
        </section>
        <Inspector controls={controls} onChange={changeControl} onReset={() => setControls(defaults(preset))} />
      </main>
      <Sources dialog={dialog} />
    </>
  );
}

createRoot(document.getElementById('root')).render(<Studio />);
