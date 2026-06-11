// audio.js — Pizza Empire Sound & Music System
// Web Audio API — no external files needed, procedurally generated
var GameAudio = (function () {
  'use strict';

  var ctx = null;
  var masterGain = null;
  var musicGain = null;
  var sfxGain = null;
  var _musicPlaying = false;
  var _musicOscillators = [];
  var _ambientNodes = [];
  var _footstepTimer = 0;
  var _footstepInterval = 0.42;
  var _isMoving = false;
  var _muted = false;

  // ── BPM grid ─────────────────────────────────────────────────────────────────
  var BPM = 92;
  var BEAT = 60 / BPM;

  // ── Note frequencies (A4 = 440 Hz) ──────────────────────────────────────────
  var NOTES = {
    C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.00, A3:220.00, B3:246.94,
    C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88,
    C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880.00,
    Bb3:233.08, Eb4:311.13, Bb4:466.16
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function _ensureCtx() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.4;
      musicGain.connect(masterGain);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.8;
      sfxGain.connect(masterGain);
      return true;
    } catch (e) { return false; }
  }

  function _osc(type, freq, startTime, duration, gain, dest) {
    if (!ctx) return;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    o.connect(g);
    g.connect(dest || sfxGain);
    o.start(startTime);
    o.stop(startTime + duration + 0.05);
  }

  function _noise(duration, gainVal, startTime, dest) {
    if (!ctx) return;
    var bufSize = Math.floor(ctx.sampleRate * duration);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    src.connect(g);
    g.connect(dest || sfxGain);
    src.start(startTime);
  }

  // ── Sound effects ────────────────────────────────────────────────────────────
  function playCoin() {
    if (!_ensureCtx()) return;
    var t = ctx.currentTime;
    _osc('sine', NOTES.E5, t, 0.08, 0.3);
    _osc('sine', NOTES.G5, t + 0.08, 0.08, 0.3);
    _osc('sine', NOTES.C5 * 2, t + 0.16, 0.12, 0.25);
  }

  function playClick() {
    if (!_ensureCtx()) return;
    var t = ctx.currentTime;
    _osc('square', 440, t, 0.04, 0.15);
    _osc('square', 880, t, 0.04, 0.08);
  }

  function playSuccess() {
    if (!_ensureCtx()) return;
    var t = ctx.currentTime;
    _osc('sine', NOTES.C4, t,       0.12, 0.3);
    _osc('sine', NOTES.E4, t+0.10,  0.12, 0.3);
    _osc('sine', NOTES.G4, t+0.20,  0.12, 0.3);
    _osc('sine', NOTES.C5, t+0.30,  0.20, 0.4);
  }

  function playError() {
    if (!_ensureCtx()) return;
    var t = ctx.currentTime;
    _osc('sawtooth', 180, t,      0.15, 0.25);
    _osc('sawtooth', 150, t+0.15, 0.15, 0.25);
    _osc('sawtooth', 120, t+0.30, 0.20, 0.25);
  }

  function playPizzaBake() {
    if (!_ensureCtx()) return;
    var t = ctx.currentTime;
    // Sizzle
    _noise(0.3, 0.2, t);
    _osc('sawtooth', 200, t,      0.1, 0.1);
    _osc('sawtooth', 180, t+0.1,  0.1, 0.08);
    _osc('sine',     440, t+0.25, 0.2, 0.15);
  }

  function playDialogOpen() {
    if (!_ensureCtx()) return;
    var t = ctx.currentTime;
    _osc('sine', NOTES.G4, t,      0.08, 0.2);
    _osc('sine', NOTES.B4, t+0.07, 0.08, 0.2);
    _osc('sine', NOTES.D5, t+0.14, 0.10, 0.2);
  }

  function playFootstep() {
    if (!_ensureCtx()) return;
    var t = ctx.currentTime;
    _noise(0.06, 0.12 + Math.random() * 0.05, t);
    _osc('sine', 80 + Math.random() * 20, t, 0.06, 0.15);
  }

  function playDayEnd() {
    if (!_ensureCtx()) return;
    var t = ctx.currentTime;
    var melody = [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5, NOTES.G4, NOTES.E4, NOTES.C4];
    melody.forEach(function(freq, i) {
      _osc('sine', freq, t + i * 0.18, 0.22, 0.3);
    });
  }

  function playUnlock() {
    if (!_ensureCtx()) return;
    var t = ctx.currentTime;
    _osc('square', 220, t,       0.06, 0.2);
    _osc('square', 330, t+0.06,  0.06, 0.2);
    _osc('square', 440, t+0.12,  0.06, 0.2);
    _osc('square', 660, t+0.18,  0.12, 0.3);
    _osc('sine',   880, t+0.30,  0.25, 0.35);
  }

  function playMoney() {
    if (!_ensureCtx()) return;
    var t = ctx.currentTime;
    _osc('sine', NOTES.A4, t,      0.06, 0.25);
    _osc('sine', NOTES.C5, t+0.07, 0.06, 0.25);
    _osc('sine', NOTES.E5, t+0.14, 0.10, 0.25);
    _osc('sine', NOTES.A5, t+0.22, 0.18, 0.3);
  }

  // ── Background music ─────────────────────────────────────────────────────────
  // A looping pizzeria-style background track using oscillators
  function _scheduleNote(freq, startBeat, lengthBeats, vol) {
    var startTime = ctx.currentTime + startBeat * BEAT;
    var dur = lengthBeats * BEAT;
    _osc('triangle', freq, startTime, dur * 0.85, vol * 0.35, musicGain);
    // Add a slight harmonic
    _osc('sine', freq * 2, startTime, dur * 0.4, vol * 0.08, musicGain);
  }

  // Melody in C major (Italian/Mediterranean feel)
  var MELODY_PATTERN = [
    // [note, startBeat, lengthBeats]
    [NOTES.C4, 0,  1], [NOTES.E4, 1, 0.5], [NOTES.G4, 1.5, 0.5],
    [NOTES.A4, 2,  1], [NOTES.G4, 3, 0.5], [NOTES.F4, 3.5, 0.5],
    [NOTES.E4, 4,  1], [NOTES.D4, 5, 0.5], [NOTES.E4, 5.5, 0.5],
    [NOTES.F4, 6,  1], [NOTES.G4, 7, 0.5], [NOTES.A4, 7.5, 0.5],
    [NOTES.G4, 8,  2], [NOTES.E4, 10, 1],  [NOTES.C4, 11, 1],
    [NOTES.D4, 12, 1], [NOTES.F4, 13, 0.5],[NOTES.E4, 13.5, 0.5],
    [NOTES.D4, 14, 2], [NOTES.C4, 16, 2],
  ];

  var BASS_PATTERN = [
    [NOTES.C3, 0, 2], [NOTES.F3, 2, 2], [NOTES.G3, 4, 2], [NOTES.C3, 6, 2],
    [NOTES.A3, 8, 2], [NOTES.F3, 10, 2],[NOTES.G3, 12, 2],[NOTES.C3, 14, 4],
  ];

  var _musicTimer = null;
  var LOOP_BEATS = 18;

  function _playMusicLoop() {
    if (!ctx || !_musicPlaying) return;
    MELODY_PATTERN.forEach(function(n) { _scheduleNote(n[0], n[1], n[2], 0.6); });
    BASS_PATTERN.forEach(function(n) {
      var startTime = ctx.currentTime + n[1] * BEAT;
      _osc('sine', n[0], startTime, n[2] * BEAT * 0.7, 0.5, musicGain);
    });
    // Re-schedule the loop
    var loopDuration = LOOP_BEATS * BEAT * 1000;
    _musicTimer = setTimeout(_playMusicLoop, loopDuration - 200);
  }

  function startMusic() {
    if (!_ensureCtx() || _musicPlaying) return;
    _musicPlaying = true;
    _playMusicLoop();
  }

  function stopMusic() {
    _musicPlaying = false;
    if (_musicTimer) { clearTimeout(_musicTimer); _musicTimer = null; }
  }

  // ── Ambient city sounds ──────────────────────────────────────────────────────
  function _startAmbientLoop() {
    if (!ctx) return;
    // Low city drone
    var drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 60;
    var droneGain = ctx.createGain();
    droneGain.gain.value = 0.04;
    drone.connect(droneGain);
    droneGain.connect(masterGain);
    drone.start();
    _ambientNodes.push(drone);

    // Wind-like noise
    var windBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    var wdata = windBuf.getChannelData(0);
    for (var i = 0; i < wdata.length; i++) wdata[i] = Math.random() * 2 - 1;
    var wind = ctx.createBufferSource();
    wind.buffer = windBuf;
    wind.loop = true;
    var windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 400;
    windFilter.Q.value = 0.5;
    var windGain = ctx.createGain();
    windGain.gain.value = 0.02;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);
    wind.start();
    _ambientNodes.push(wind);
  }

  // ── Footstep update (call from game loop) ────────────────────────────────────
  function update(delta, isMoving) {
    if (!ctx || _muted) return;
    _isMoving = isMoving;
    if (isMoving) {
      _footstepTimer -= delta;
      if (_footstepTimer <= 0) {
        playFootstep();
        _footstepTimer = _footstepInterval;
      }
    } else {
      _footstepTimer = 0;
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    // Audio context must be created on user gesture
    document.addEventListener('touchstart', function _firstTouch() {
      document.removeEventListener('touchstart', _firstTouch);
      if (!_ensureCtx()) return;
      if (ctx.state === 'suspended') ctx.resume();
      _startAmbientLoop();
      startMusic();
    }, { once: true });

    document.addEventListener('click', function _firstClick() {
      document.removeEventListener('click', _firstClick);
      if (!_ensureCtx()) return;
      if (ctx.state === 'suspended') ctx.resume();
      _startAmbientLoop();
      startMusic();
    }, { once: true });
  }

  function setMuted(val) {
    _muted = val;
    if (masterGain) masterGain.gain.value = val ? 0 : 0.7;
  }

  return {
    init: init,
    update: update,
    startMusic: startMusic,
    stopMusic: stopMusic,
    setMuted: setMuted,
    playCoin: playCoin,
    playClick: playClick,
    playSuccess: playSuccess,
    playError: playError,
    playPizzaBake: playPizzaBake,
    playDialogOpen: playDialogOpen,
    playDayEnd: playDayEnd,
    playUnlock: playUnlock,
    playMoney: playMoney,
  };
}());
