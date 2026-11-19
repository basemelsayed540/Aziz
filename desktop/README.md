# نسخة الويندوز (Windows 7 / 10)
- Electron 22.3.27 (آخر إصدار يدعم ويندوز 7) – ملف 32-bit.
- يشتغل بدون إنترنت من نسخة محفوظة، ويفحص `index.html` على GitHub Pages كل 30 دقيقة ويحدّث نفسه.
- البناء: انسخ `index.html` بجوار `main.js` ثم:
  `npx @electron/packager . SalesAnalyzer --platform=win32 --arch=ia32 --electron-version=22.3.27 --asar`
