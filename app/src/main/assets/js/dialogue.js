// dialogue.js — Full NPC dialogue system for Pizza Empire
// Uses global THREE, IIFE pattern

var Dialogue = (function () {
  'use strict';

  // ─── CSS injection ───────────────────────────────────────────────────────────
  var CSS = [
    '#overlay-dialogue {',
    '  position:fixed; bottom:0; left:0; right:0; z-index:45;',
    '  background:rgba(8,6,4,.95);',
    '  border-top: 1.5px solid rgba(245,197,66,.2);',
    '  padding: 16px 16px 36px;',
    '  transform: translateY(100%);',
    '  transition: transform .3s ease;',
    '  backdrop-filter: blur(12px);',
    '  font-family: "Segoe UI", Arial, sans-serif;',
    '  box-sizing: border-box;',
    '  max-height: 70vh;',
    '  overflow-y: auto;',
    '}',
    '#overlay-dialogue.open { transform: translateY(0); }',
    '#dlg-rel-bar-wrap {',
    '  display:flex; align-items:center; gap:8px;',
    '  margin-bottom:12px;',
    '}',
    '#dlg-rel-label {',
    '  color:rgba(245,197,66,.7); font-size:11px;',
    '  white-space:nowrap; min-width:80px;',
    '}',
    '#dlg-rel-track {',
    '  flex:1; height:4px; background:rgba(255,255,255,.1);',
    '  border-radius:2px; overflow:hidden;',
    '}',
    '#dlg-rel-fill {',
    '  height:100%; background:rgba(245,197,66,.8);',
    '  border-radius:2px; transition:width .4s ease;',
    '}',
    '#dlg-npc-name {',
    '  color:#f5c542; font-size:15px; font-weight:700;',
    '  letter-spacing:.05em; margin-bottom:8px;',
    '}',
    '#dlg-line {',
    '  color:#e8e8e8; font-size:14px; line-height:1.5;',
    '  min-height:40px; margin-bottom:16px;',
    '  border-left:2px solid rgba(245,197,66,.3);',
    '  padding-left:10px;',
    '}',
    '#dlg-buttons {',
    '  display:flex; flex-direction:column; gap:8px;',
    '}',
    '.dlg-btn {',
    '  background:rgba(245,197,66,.08);',
    '  border:1px solid rgba(245,197,66,.25);',
    '  color:#e8e8e8; font-size:13px;',
    '  padding:9px 14px; border-radius:6px;',
    '  cursor:pointer; text-align:left;',
    '  transition:background .15s, border-color .15s;',
    '}',
    '.dlg-btn:hover {',
    '  background:rgba(245,197,66,.18);',
    '  border-color:rgba(245,197,66,.6);',
    '}',
    '.dlg-btn.dlg-close {',
    '  color:rgba(255,255,255,.45);',
    '  border-color:rgba(255,255,255,.1);',
    '}',
    '.dlg-btn.dlg-close:hover {',
    '  background:rgba(255,255,255,.06);',
    '  border-color:rgba(255,255,255,.25);',
    '}',
    '#dlg-reply {',
    '  color:rgba(200,200,200,.7); font-size:12px;',
    '  font-style:italic; margin-top:10px;',
    '  min-height:20px; line-height:1.5;',
    '  padding-left:10px;',
    '}',
  ].join('\n');

  // ─── Response pools (German) ──────────────────────────────────────────────────
  var POOLS = {
    friendly: [
      'Alles gut, danke!',
      'Schöner Tag, nicht?',
      'Man macht was man kann.',
      'Läuft soweit, danke der Nachfrage!',
    ],
    suspicious: [
      'Warum fragst du das?',
      'Lass mich in Ruhe.',
      'Ich kenn dich nicht.',
      'Das geht dich nichts an.',
    ],
    gangMember: [
      'Marco lässt sich nicht so leicht finden.',
      'Du stellst zu viele Fragen.',
      'Komm heute Nacht zur Famiglia.',
      'Lass das lieber sein, Freund.',
    ],
    aboutMarco: [
      'Er ist ein gefährlicher Mann.',
      'Vorsicht. Er hat Augen überall.',
      'Mein Bruder schuldet ihm Geld.',
      'Sprich seinen Namen nicht laut aus.',
    ],
    police: [
      'Wir ermitteln. Sag mir wenn du etwas siehst.',
      'Die Russoni-Bande wird bald Probleme bekommen.',
      'Bleib sauber, dann passiert dir nichts.',
    ],
    suspicious_activity: [
      'Letzte Nacht waren seltsame Typen im Viertel.',
      'Ich hab gehört, dass Marco neue Leute rekrutiert.',
      'Die Polizei schaut sich das Lagerhaus an.',
      'Jemand wurde beschattet — ich weiß nicht wer.',
    ],
  };

  // ─── Private state ────────────────────────────────────────────────────────────
  var _overlay = null;
  var _nameEl = null;
  var _lineEl = null;
  var _replyEl = null;
  var _relFill = null;
  var _relLabel = null;
  var _btnContainer = null;
  var _open = false;
  var _currentNpc = null;
  var _onCloseFn = null;
  var _relationship = 0;    // local mirror for current NPC session

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  function _injectCSS() {
    if (document.getElementById('dlg-style')) return;
    var s = document.createElement('style');
    s.id = 'dlg-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function _buildOverlay() {
    var el = document.getElementById('overlay-dialogue');
    if (!el) {
      el = document.createElement('div');
      el.id = 'overlay-dialogue';
      document.body.appendChild(el);
    }
    el.innerHTML = [
      '<div id="dlg-rel-bar-wrap">',
      '  <span id="dlg-rel-label">Beziehung</span>',
      '  <div id="dlg-rel-track"><div id="dlg-rel-fill" style="width:0%"></div></div>',
      '</div>',
      '<div id="dlg-npc-name"></div>',
      '<div id="dlg-line"></div>',
      '<div id="dlg-reply"></div>',
      '<div id="dlg-buttons"></div>',
    ].join('');

    _nameEl = el.querySelector('#dlg-npc-name');
    _lineEl = el.querySelector('#dlg-line');
    _replyEl = el.querySelector('#dlg-reply');
    _relFill = el.querySelector('#dlg-rel-fill');
    _relLabel = el.querySelector('#dlg-rel-label');
    _btnContainer = el.querySelector('#dlg-buttons');
    _overlay = el;
  }

  function _pickLine(npc) {
    var lines = npc.dialogLines;
    if (!lines || lines.length === 0) return 'Hallo.';
    // vary by time-of-day if available
    var hour = (window.gameState && window.gameState.hour) ? window.gameState.hour : new Date().getHours();
    var idx = hour % lines.length;
    return lines[idx];
  }

  function _randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function _updateRelBar() {
    var pct = Math.max(0, Math.min(100, _relationship));
    _relFill.style.width = pct + '%';
    _relLabel.textContent = 'Beziehung ' + pct + '/100';
  }

  function _applyRelDelta(delta, npc) {
    _relationship = Math.max(0, Math.min(100, _relationship + delta));
    // persist back to gameState or npc object
    if (npc) npc.relationship = _relationship;
    _updateRelBar();
  }

  function _showReply(text) {
    _replyEl.textContent = '„' + text + '"';
  }

  function _clearReply() {
    _replyEl.textContent = '';
  }

  function _isGameDayGt(n) {
    return window.gameState && window.gameState.day > n;
  }

  function _writeGlobalTrust(key, val) {
    if (window.gameState) {
      window.gameState[key] = Math.max(0, Math.min(100,
        ((window.gameState[key] || 0) + val)));
    }
  }

  // ─── Button builders ──────────────────────────────────────────────────────────
  function _makeBtn(label, classList, onClick) {
    var btn = document.createElement('button');
    btn.className = 'dlg-btn' + (classList ? ' ' + classList : '');
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function _buildButtons(npc) {
    _btnContainer.innerHTML = '';
    _clearReply();

    // 1) Wie läuft's?
    _btnContainer.appendChild(_makeBtn('Wie läuft\'s?', '', function () {
      _applyRelDelta(5, npc);
      var pool = (npc.personality === 'suspicious') ? POOLS.suspicious : POOLS.friendly;
      _showReply(_randomFrom(pool));
    }));

    // 2) About Marco (shown after day 3)
    if (_isGameDayGt(3)) {
      _btnContainer.appendChild(_makeBtn('Was weißt du über Marco?', '', function () {
        _applyRelDelta(npc.isGangMember ? 10 : 5, npc);
        var pool = npc.isGangMember ? POOLS.gangMember : POOLS.aboutMarco;
        _showReply(_randomFrom(pool));
        if (npc.isGangMember) {
          _writeGlobalTrust('gangTrust', 8);
        }
      }));
    }

    // 3) Suspicious activity
    _btnContainer.appendChild(_makeBtn('Irgendwas Verdächtiges?', '', function () {
      _applyRelDelta(5, npc);
      if (npc.isPolice) {
        _showReply(_randomFrom(POOLS.police));
        _writeGlobalTrust('policeTrust', 10);
      } else {
        _showReply(_randomFrom(POOLS.suspicious_activity));
      }
    }));

    // 4) Quest (if available)
    if (npc.questAvailable) {
      var qLabel = '📋 ' + npc.questAvailable.text + ' (' + npc.questAvailable.reward + '€)';
      _btnContainer.appendChild(_makeBtn(qLabel, '', function () {
        _applyRelDelta(10, npc);
        _showReply('Das wäre sehr hilfreich von dir!');
        if (window.gameState && window.gameState.acceptQuest) {
          window.gameState.acceptQuest(npc.questAvailable.id);
        }
      }));
    }

    // 5) Close
    _btnContainer.appendChild(_makeBtn('Tschüss', 'dlg-close', function () {
      _module.close();
    }));
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  var _module = {

    init: function () {
      _injectCSS();
      _buildOverlay();

      // Close on overlay background click (outside panel content)
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && _open) {
          _module.close();
        }
      });
    },

    open: function (npc) {
      if (!_overlay) _module.init();
      _currentNpc = npc;
      _relationship = typeof npc.relationship === 'number' ? npc.relationship : 0;

      // Populate header
      _nameEl.textContent = npc.name || 'Unbekannt';
      _lineEl.textContent = _pickLine(npc);
      _updateRelBar();

      // Build response buttons
      _buildButtons(npc);

      // Increment relationship for initiating talk
      _applyRelDelta(5, npc);

      // Slide up
      _overlay.classList.add('open');
      _open = true;
    },

    close: function () {
      if (!_overlay) return;
      _overlay.classList.remove('open');
      _open = false;
      _currentNpc = null;
      if (typeof _onCloseFn === 'function') {
        _onCloseFn();
      }
    },

    isOpen: function () {
      return _open;
    },

    setOnClose: function (fn) {
      _onCloseFn = fn;
    },

    // Refresh the current line (call from game loop if desired)
    refreshLine: function () {
      if (_open && _currentNpc) {
        _lineEl.textContent = _pickLine(_currentNpc);
      }
    },

    // Expose pools for external customisation
    POOLS: POOLS,
  };

  return _module;
}());
