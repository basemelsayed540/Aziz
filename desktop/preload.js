const { ipcRenderer } = require('electron');
ipcRenderer.on('update-ready', () => {
  const show = () => {
    if (document.getElementById('__upd')) return;
    const b = document.createElement('div');
    b.id = '__upd';
    b.dir = 'rtl';
    b.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:99999;background:#15803d;color:#fff;padding:10px 14px;border-radius:10px;font:600 14px Tahoma,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3);display:flex;gap:10px;align-items:center';
    b.innerHTML = '<span>تم تحميل تحديث جديد</span>';
    const r = document.createElement('button');
    r.textContent = 'تحديث الآن';
    r.style.cssText = 'background:#fff;color:#15803d;border:0;border-radius:6px;padding:4px 10px;font:700 13px Tahoma,sans-serif;cursor:pointer';
    r.onclick = () => ipcRenderer.send('reload-app');
    const x = document.createElement('button');
    x.textContent = '×';
    x.style.cssText = 'background:transparent;color:#fff;border:0;font-size:18px;cursor:pointer';
    x.onclick = () => b.remove();
    b.append(r, x);
    document.body.appendChild(b);
  };
  if (document.body) show(); else window.addEventListener('DOMContentLoaded', show);
});
