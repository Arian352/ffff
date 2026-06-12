'use strict';
// ============================================================
// PIZZA EMPIRE – In-Game Asset Downloader
// APK ships ~100 MB base assets; on first run this module
// downloads additional HD packs (1-2 GB) and stores them in
// IndexedDB so the game runs fully offline after the download.
// ============================================================
var AssetDownloader = (function () {

  var DB_NAME    = 'pizza_empire_assets_v1';
  var STORE_NAME = 'files';
  var READY_KEY  = 'pe_hd_assets_ready';

  // ---- Asset packs -----------------------------------------------
  // Each pack is an array of { key, url, size } objects.
  // The 'key' is used to store/retrieve from IndexedDB.
  // Replace these URLs with your GitHub Release asset URLs once
  // you've uploaded the HD packs.
  // ----------------------------------------------------------------
  var PACKS = [
    {
      name: 'HD-Texturen',
      totalMB: 340,
      files: [
        // { key: 'tex_hd_buildings', url: 'https://github.com/arian352/ffff/releases/download/hd-v1/buildings_hd.jpg' },
        // { key: 'tex_hd_ground',    url: 'https://github.com/arian352/ffff/releases/download/hd-v1/ground_hd.jpg'    },
      ]
    },
    {
      name: 'HD-Charaktermodelle',
      totalMB: 210,
      files: []
    },
    {
      name: 'Extra-Skyboxen',
      totalMB: 180,
      files: []
    },
  ];

  var _db = null;

  function _openDB() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function (e) {
        e.target.result.createObjectStore(STORE_NAME);
      };
      req.onsuccess = function (e) { _db = e.target.result; resolve(_db); };
      req.onerror   = function ()  { reject(req.error); };
    });
  }

  function isComplete() {
    try { return localStorage.getItem(READY_KEY) === '1'; } catch(e) { return true; }
  }

  function markComplete() {
    try { localStorage.setItem(READY_KEY, '1'); } catch(e) {}
  }

  // Store an ArrayBuffer/Blob in IndexedDB under 'key'.
  function storeFile(key, blob) {
    return new Promise(function (resolve, reject) {
      if (!_db) { resolve(); return; }
      var tx  = _db.transaction(STORE_NAME, 'readwrite');
      var req = tx.objectStore(STORE_NAME).put(blob, key);
      tx.oncomplete = resolve;
      tx.onerror    = function () { reject(tx.error); };
    });
  }

  // Return a blob: URL for a previously stored file, or null.
  function getURL(key) {
    return new Promise(function (resolve) {
      if (!_db) { resolve(null); return; }
      var tx  = _db.transaction(STORE_NAME, 'readonly');
      var req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = function () {
        resolve(req.result ? URL.createObjectURL(req.result) : null);
      };
      req.onerror = function () { resolve(null); };
    });
  }

  // Download a single file and report progress (0-1).
  function _fetchFile(url, onProgress) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
      var total  = parseInt(res.headers.get('content-length') || '0', 10);
      var reader = res.body.getReader();
      var chunks = [];
      var received = 0;
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return new Blob(chunks);
          chunks.push(r.value);
          received += r.value.length;
          if (onProgress && total > 0) onProgress(received / total);
          return pump();
        });
      }
      return pump();
    });
  }

  // ---- Main entry point ------------------------------------------
  // Shows the download screen, runs all packs, then calls onDone.
  // If all packs have no files (URLs not yet set) we immediately
  // complete with a brief animated loader so the screen still appears.
  // ----------------------------------------------------------------
  function run(onDone) {
    var hasRealFiles = PACKS.some(function (p) { return p.files.length > 0; });

    _openDB().catch(function () {}).then(function () {
      if (hasRealFiles) {
        _runRealDownload(onDone);
      } else {
        _runDemoMode(onDone);
      }
    });
  }

  // Demo mode: animate the bars to 100% over ~2 s, then complete.
  function _runDemoMode(onDone) {
    var packs = [
      document.getElementById('dl-bar-0'),
      document.getElementById('dl-bar-1'),
      document.getElementById('dl-bar-2'),
    ].filter(Boolean);
    var totalEl = document.getElementById('dl-total-text');
    var duration = 1800;
    var start = Date.now();

    function tick() {
      var pct = Math.min((Date.now() - start) / duration, 1);
      packs.forEach(function (b) { b.style.width = (pct * 100) + '%'; });
      if (totalEl) {
        var mb = Math.round(pct * 730);
        totalEl.textContent = mb + ' MB / 730 MB';
      }
      if (pct < 1) {
        requestAnimationFrame(tick);
      } else {
        markComplete();
        setTimeout(onDone, 400);
      }
    }
    requestAnimationFrame(tick);
  }

  // Real download: fetch every file across all packs.
  function _runRealDownload(onDone) {
    var packEls   = document.querySelectorAll('.dl-bar');
    var totalEl   = document.getElementById('dl-total-text');
    var totalMB   = PACKS.reduce(function (a, p) { return a + p.totalMB; }, 0);
    var downloaded = 0;

    var packPromises = PACKS.map(function (pack, pi) {
      var barEl = packEls[pi];
      var filePromises = pack.files.map(function (f) {
        return _fetchFile(f.url, function (pct) {
          if (barEl) barEl.style.width = (pct * 100) + '%';
        }).then(function (blob) {
          return storeFile(f.key, blob).then(function () {
            downloaded += pack.totalMB / pack.files.length;
            if (totalEl) {
              totalEl.textContent =
                Math.round(Math.min(downloaded, totalMB)) + ' MB / ' + totalMB + ' MB';
            }
          });
        }).catch(function (err) {
          console.warn('Asset download failed:', f.key, err);
        });
      });
      return Promise.all(filePromises);
    });

    Promise.all(packPromises).then(function () {
      markComplete();
      onDone();
    }).catch(function () {
      markComplete(); // skip on error – game runs with base assets
      onDone();
    });
  }

  return {
    isComplete:   isComplete,
    markComplete: markComplete,
    run:          run,
    getURL:       getURL,
    PACKS:        PACKS,
  };
}());
