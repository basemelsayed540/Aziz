'use strict';
const { app, BrowserWindow, protocol, shell, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

// ====== إعدادات ======
const UPDATE_URL = 'https://basemelsayed540.github.io/Aziz/index.html';
const CHECK_EVERY_MS = 30 * 60 * 1000;
const MIN_SIZE = 200 * 1024;                       // حماية من صفحة خطأ/ملف ناقص
const MARKERS = ['محلل مبيعات', 'id="drop"', 'XLSX'];  // لازم تكون موجودة في أي نسخة سليمة
// =====================

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;
const bundled = () => path.join(__dirname, 'index.html');
const cacheDir = () => path.join(app.getPath('userData'), 'app');
const cached = () => path.join(cacheDir(), 'index.html');

function valid(buf) {
  if (!buf || buf.length < MIN_SIZE) return false;
  const t = buf.toString('utf8');
  return MARKERS.every(m => t.includes(m)) && t.trimEnd().toLowerCase().endsWith('</html>');
}
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

function currentHtml() {
  try {
    const b = fs.readFileSync(cached());
    if (valid(b)) return b;
  } catch (e) {}
  return fs.readFileSync(bundled());
}

function fetchRemote() {
  return new Promise((resolve, reject) => {
    const url = UPDATE_URL + '?t=' + Date.now();
    const req = https.get(url, { headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'SalesAnalyzer' }, timeout: 20000 }, res => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function checkUpdate() {
  try {
    const remote = await fetchRemote();
    if (!valid(remote)) return;                         // رد غير سليم → نتجاهله
    if (sha(remote) === sha(currentHtml())) return;     // نفس النسخة
    fs.mkdirSync(cacheDir(), { recursive: true });
    const tmp = cached() + '.tmp';
    fs.writeFileSync(tmp, remote);
    fs.renameSync(tmp, cached());
    if (win && !win.isDestroyed()) win.webContents.send('update-ready');
  } catch (e) { /* لا إنترنت أو خطأ مؤقت: نكمل بالنسخة الحالية */ }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 900, minHeight: 600,
    title: 'محلل المبيعات', autoHideMenuBar: true, backgroundColor: '#f4f6f8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadURL('app://local/index.html');
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://local/')) { e.preventDefault(); if (/^https:\/\//i.test(url)) shell.openExternal(url); }
  });
  win.on('closed', () => { win = null; });
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.registerBufferProtocol('app', (req, cb) => {
    try {
      const u = new URL(req.url);
      if (u.pathname === '/' || u.pathname === '/index.html') {
        return cb({ mimeType: 'text/html', data: currentHtml() });
      }
      cb({ statusCode: 404, data: Buffer.from('not found') });
    } catch (e) { cb({ statusCode: 500, data: Buffer.from('error') }); }
  });
  ipcMain.on('reload-app', () => { if (win) win.webContents.reloadIgnoringCache(); });
  createWindow();
  setTimeout(checkUpdate, 3000);
  setInterval(checkUpdate, CHECK_EVERY_MS);
});

app.on('window-all-closed', () => app.quit());
