<div align="center">

# GalaxyV2

**Galaksini şekillendir, diskin zamanla nasıl değiştiğini izle**

[**Canlı stüdyoyu aç ↗**](https://hfatih.github.io/GalaxyV2/) · [English](README.md) · [Kontroller](#kontroller)

[![GalaxyV2’de tam ekran Samanyolu ve evrim zaman çizelgesi](assets/samanyolu.jpg)](https://hfatih.github.io/GalaxyV2/)

</div>

GalaxyV2, [Samanyolu3D](https://github.com/hfatih/samanyolu3d) ayarlarını tam ekran 3B sahneye taşır. Samanyolu, Andromeda veya Özel Ayar’ı seç. **Ayarlar** panelinden kolları, disk burkulmasını ve yıldız dağılımını değiştir.

## Kontroller

| Bölüm | Ayar | Aralık |
| --- | --- | --- |
| **Kollar ve disk** | Kol sayısı | 2–8 |
| | Kol burulması | 0–4 |
| | Kol yayılımı | 0,05–1,2 |
| | Disk burkulması | 0–40 |
| **Yıldız popülasyonu** | Disk yıldız örneği | 20.000–400.000 |
| | Çekirdek yıldız örneği | 2.000–80.000 |
| | Halo yıldız örneği | 2.000–100.000 |
| **Görünüm ve hareket** | Yıldız boyutu | 0,1–3 |
| | Dönüş hızı | 0–0,2 |
| | Toz katmanı | Açık/kapalı |

Sürgüleri kullanabilir veya yanındaki kutuya değer yazabilirsin. **Sıfırla**, seçili modeli başlangıç ayarlarına döndürür. **Özel Ayar**’daki değerler oturum içinde modeller arasında geçiş yaptığında saklanır.

| Kamera | Masaüstü | Dokunmatik |
| --- | --- | --- |
| Döndür | Sol tuşla sürükle | Tek parmakla sürükle |
| Kaydır | Sağ tuşla sürükle veya sahne odaktayken ok tuşlarını kullan | İki parmakla sürükle |
| Yakınlaştır | Fare tekerleği | İki parmakla kıstır |
| Görüş açısı | **Eğik**, **Üst**, **Yan** | Aynı düğmeler |

Diskin bükülmesini **Yan** görünümde inceleyebilirsin. Kamera çubuğundan tarayıcı tam ekranına geçebilir ve konum işaretçilerini açıp kapatabilirsin. Galaktik merkez her modelde, Güneş Sistemi ve Orion Kolu yalnızca Samanyolu’nda görünür.

<details>
<summary>Andromeda önizlemesi</summary>

![GalaxyV2’de Andromeda, 150 milyon yıl diferansiyel dönüşten sonra](assets/andromeda.jpg)

</details>

## Evrim modeli

**Diferansiyel dönüş** modunda her disk örneği kendi yarıçapındaki dairesel yörüngede ilerler. İç ve dış disk arasındaki açısal hız farkı başlangıçtaki kolları zamanla sarar. **Sabit biçim** modu karşılaştırma için diskin tamamını referans yarıçapın açısal hızıyla döndürür. Zaman çizelgesini duraklatabilir, sıfırlayabilir veya 0 ile 1.000 milyon yıl arasında istediğin konuma getirebilirsin.

Orta düzlemde dairesel hızın karesi, Miyamoto–Nagai diski, Hernquist merkez şişkinliği ve Navarro–Frenk–White halosunun katkılarının toplamıdır. $R$ kpc, $v_c$ km/s cinsindendir.

$$
v_c^2=v_{\mathrm{disk}}^2+v_{\mathrm{bulge}}^2+v_{\mathrm{halo}}^2,
\qquad
\Omega(R)=1.022712165\times10^{-3}\frac{v_c(R)}{R}\ \mathrm{rad/Myr}.
$$

GPU, noktanın açısını $\phi(t)=\phi_0-\Omega(R)t$ ile hesaplar. Noktalar başlangıçtaki yarıçap ve yüksekliklerinde kalır. İlk 0,35 kpc’de ortak bir açısal hız kullanılır. Sabit potansiyelli bu kinematik model yıldızların karşılıklı çekimini, gaz dinamiğini ve yıldız oluşumunu ihmal eder. [Sarmal kolların sarılması](https://galaxiesbook.org/chapters/IV-04.-Internal-Evolution-in-Galaxies_3-Spiral-structure.html) · [Samanyolu dönüş eğrisi](https://arxiv.org/abs/1810.09466)

## Çizim ve ölçek

Şekil, zaman ve örnek sayısı değiştiğinde GPU aynı yıldız arabelleklerini kullanır. Otomatik kalite, çizim çözünürlüğünü ve çizilen örnek oranını ölçülen kare süresine göre uyarlar. Kalite göstergesi, azaltma olduğunda bu oranı verir.

Yıldız ölçeği, Samanyolu3D’nin referans yıldız sayısını disk, çekirdek ve halo örneklerinin toplamına böler. Samanyolu için 150 milyar, Andromeda için bir trilyon kullanılır. Model mesafeleri ve işaretçi konumları görselleştirme amaçlıdır. [Orijinal projenin kaynakları](https://github.com/hfatih/samanyolu3d/blob/main/README.tr.md#-bilimsel-referanslar-ve-notlar)

## Yerelde çalıştır

Node.js 22.12 veya üzeri ve WebGL destekli bir tarayıcı gerekir.

```sh
git clone https://github.com/hfatih/GalaxyV2.git
cd GalaxyV2
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

Arayüz React, sahne Three.js ve React Three Fiber ile çalışır. Vite çıktıyı `dist/` dizinine üretir. GitHub Pages derlenmiş çıktıyı `gh-pages` dalından sunar. [Galaksi modeli](src/model.js) · [3B sahne](src/Scene.jsx) · [Ayar paneli](src/Inspector.jsx)

Kod [MIT](LICENSE) lisanslıdır. [DM Sans](assets/dm-sans-OFL.txt) yazı tipi SIL Open Font lisansıyla dağıtılır.
