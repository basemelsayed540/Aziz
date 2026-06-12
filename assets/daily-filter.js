(function () {
  'use strict';
  var DAILY_LABEL = '\u0627\u0644\u064A\u0648\u0645\u064A\u0629';
  var ADMIN_KEY = 'admin_daily_filter';
  var REP_KEY = 'flt_d';
  var CHIP_CLASS = 'df-chip';
  var ACTIVE_CLASS = 'df-active';
  var WRAPPER_CLASS = 'df-wrapper';

  var css = '\
.' + CHIP_CLASS + '{display:inline-flex;align-items:center;justify-content:center;padding:5px 13px;border-radius:9999px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid #d1d5db;background:#fff;color:#374151;transition:all .15s;white-space:nowrap;min-height:32px}\
.' + CHIP_CLASS + ':hover{border-color:#a78bfa;background:#f5f3ff;color:#6d28d9}\
.' + ACTIVE_CLASS + '{border-color:#7c3aed;background:#7c3aed;color:#fff;box-shadow:0 2px 8px rgba(124,58,237,.25)}\
.' + ACTIVE_CLASS + ':hover{border-color:#6d28d9;background:#6d28d9;color:#fff}\
.dark .' + CHIP_CLASS + '{background:#2a2a2a;border-color:#4b5563;color:#d1d5db}\
.dark .' + CHIP_CLASS + ':hover{border-color:#8b5cf6;background:#3b1f6e;color:#c4b5fd}\
.dark .' + ACTIVE_CLASS + '{border-color:#8b5cf6;background:#7c3aed;color:#fff}\
.' + WRAPPER_CLASS + '{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;align-items:center}\
.df-hidden{display:none!important}\
.df-date-inp{padding:4px 10px;border-radius:9999px;font-size:12px;border:1.5px solid #d1d5db;background:#fff;color:#374151;min-height:32px;outline:none;cursor:pointer}\
.dark .df-date-inp{background:#2a2a2a;border-color:#4b5563;color:#d1d5db}\
.df-date-inp:focus{border-color:#7c3aed;box-shadow:0 0 0 2px rgba(124,58,237,.15)}\
';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  var PRESETS = [
    { label: '\u0627\u0644\u064A\u0648\u0645', getValue: function () { return today(); } },
    { label: '\u0623\u0645\u0633', getValue: function () { return yesterday(); } },
    { label: '\u0622\u062E\u0631 \u0663 \u0623\u064A\u0627\u0645', getValue: function () { return daysAgo(3); } },
    { label: '\u0622\u062E\u0631 \u0667 \u0623\u064A\u0627\u0645', getValue: function () { return daysAgo(7); } },
    { label: '\u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631', getValue: function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01'; } }
  ];

  function isAdmin() { return window.location.pathname.indexOf('/admin') !== -1; }
  function storageKey() { return isAdmin() ? ADMIN_KEY : REP_KEY; }
  function getVal() { return localStorage.getItem(storageKey()) || ''; }

  function findContainer(labelEl) {
    for (var el = labelEl.parentElement; el; el = el.parentElement) {
      if (el.className && el.className.indexOf('relative') >= 0) return el;
      if (el.tagName === 'DIV' && el.querySelector('button') && el.querySelector('label')) {
        var lbs = el.querySelectorAll('label');
        for (var i = 0; i < lbs.length; i++) {
          if (lbs[i].textContent.trim() === DAILY_LABEL) return el;
        }
      }
    }
    return labelEl.parentElement;
  }

  function clickOption(container, value) {
    var btn = container.querySelector('button');
    if (!btn) return;
    btn.click();
    setTimeout(function () {
      var panel = container.querySelector('[class*="absolute z-10"]');
      if (!panel) return;
      var opts = panel.querySelectorAll('button');
      for (var i = 0; i < opts.length; i++) {
        var txt = opts[i].textContent.trim();
        if (value === '' && txt.indexOf('\u2013') >= 0) { opts[i].click(); return; }
        if (value === txt) { opts[i].click(); return; }
      }
      var allBtns = container.querySelectorAll('button');
      var found = false;
      for (var i = 0; i < allBtns.length; i++) {
        if (allBtns[i] === btn) continue;
        var txt = allBtns[i].textContent.trim();
        if (value === '' && txt.indexOf('\u2013') >= 0) { allBtns[i].click(); found = true; break; }
        if (value === txt) { allBtns[i].click(); found = true; break; }
      }
      if (!found && value === '') {
        var clearBtns = container.querySelectorAll('[class*="border-b"]');
        for (var i = 0; i < clearBtns.length; i++) {
          if (clearBtns[i].tagName === 'BUTTON') { clearBtns[i].click(); return; }
        }
        location.reload();
      }
    }, 80);
  }

  function transform() {
    var labels = document.querySelectorAll('label');
    for (var i = 0; i < labels.length; i++) {
      var lb = labels[i];
      if (lb.textContent.trim() !== DAILY_LABEL || lb.dataset.dfDone) continue;
      lb.dataset.dfDone = '1';
      var container = findContainer(lb);
      if (!container) continue;
      var mainBtn = container.querySelector('button');
      if (!mainBtn) continue;
      if (container.querySelector('.' + WRAPPER_CLASS)) continue;

      var curVal = getVal();

      mainBtn.classList.add('df-hidden');

      var wrap = document.createElement('div');
      wrap.className = WRAPPER_CLASS;

      for (var p = 0; p < PRESETS.length; p++) {
        (function (preset) {
          var ch = document.createElement('button');
          ch.type = 'button';
          ch.textContent = preset.label;
          ch.className = CHIP_CLASS;
          ch.dataset.val = preset.getValue();
          if (curVal && curVal >= ch.dataset.val && curVal <= today()) ch.classList.add(ACTIVE_CLASS);
          if (!curVal && ch.dataset.val === '') ch.classList.add(ACTIVE_CLASS);
          ch.addEventListener('click', function () {
            var val = preset.getValue();
            wrap.querySelectorAll('.' + CHIP_CLASS).forEach(function (c) { c.classList.remove(ACTIVE_CLASS); });
            ch.classList.add(ACTIVE_CLASS);
            localStorage.setItem(storageKey(), val);
            clickOption(container, val);
          });
          wrap.appendChild(ch);
        })(PRESETS[p]);
      }

      var sep = document.createElement('span');
      sep.textContent = '\u007C';
      sep.style.cssText = 'color:#9ca3af;font-size:12px;font-weight:700;margin:0 3px';
      wrap.appendChild(sep);

      var dateInp = document.createElement('input');
      dateInp.type = 'date';
      dateInp.className = 'df-date-inp';
      if (curVal && !isNaN(Date.parse(curVal))) dateInp.value = curVal;
      dateInp.addEventListener('change', function () {
        var val = this.value;
        localStorage.setItem(storageKey(), val);
        wrap.querySelectorAll('.' + CHIP_CLASS).forEach(function (c) { c.classList.remove(ACTIVE_CLASS); });
        clickOption(container, val);
      });

      var dwrap = document.createElement('div');
      dwrap.style.cssText = 'display:inline-flex;align-items:center;gap:3px';
      dwrap.appendChild(dateInp);
      wrap.appendChild(dwrap);

      lb.parentNode.insertBefore(wrap, lb.nextSibling);
    }
  }

  var obs = new MutationObserver(function () { transform(); });
  obs.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', transform);
  else transform();
})();
