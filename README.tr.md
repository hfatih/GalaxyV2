<div align="center">

# GalaxyV2

**Tarayıcıda kendi galaksini şekillendir**

[**Canlı stüdyoyu aç ↗**](https://hfatih.github.io/GalaxyV2/) · [English](README.md) · [Kontroller](#kontroller)

[![GalaxyV2’de Samanyolu ve galaksi ayarları paneli](assets/samanyolu.jpg)](https://hfatih.github.io/GalaxyV2/)

</div>

GalaxyV2, [Samanyolu3D](https://github.com/hfatih/samanyolu3d) simülasyonunun yenilenmiş stüdyo arayüzüdür. Samanyolu, Andromeda veya Özel Ayar’ı açıp sarmal kolları, disk burkulmasını ve yıldız dağılımını sahnenin yanında düzenleyebilirsin. Galaksi üretim algoritması ve hazır modellerin değerleri orijinal projeden gelir.

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

Diskin bükülmesini **Yan** görünümde inceleyebilirsin. Sahnenin altından dönüşü duraklatabilir ve Güneş Sistemi, Orion Kolu ve galaktik merkez işaretçilerini açıp kapatabilirsin. İlk iki etiket Samanyolu referans işaretçisidir.

<details>
<summary>Andromeda önizlemesi</summary>

![GalaxyV2’de Andromeda ve orijinal model ayarları](assets/andromeda.jpg)

</details>

## Model ve ölçek

Tohumlu örnekleme diskteki yıldızları sarmal kollara dağıtır. Kol yayılımı Gauss dağılımıyla, disk burkulması ise yarıçapla büyüyen sinüs terimiyle hesaplanır. Çekirdek ve halo ayrı örneklenir. Dönüş hızı tüm galaksi grubunun hareketini belirler.

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
