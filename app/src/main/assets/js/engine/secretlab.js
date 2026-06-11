// secretlab.js — Secret underground lab below the pizza restaurant
// Uses global THREE, IIFE pattern

var SecretLab = (function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────────
  var LAB_ROOM = { x: 9, y: -5, z: -36 };
  var HATCH_POS = { x: 9, y: 0.01, z: -33 };   // office floor position
  var STORAGE_KEY = 'pizza_lab_state';

  var ROOM_W = 8;
  var ROOM_H = 3.5;
  var ROOM_D = 8;

  // ─── Private state ────────────────────────────────────────────────────────────
  var _unlocked = false;
  var _scene = null;
  var _hatchMesh = null;
  var _stairMeshes = [];
  var _labMeshes = [];
  var _bulbLight = null;
  var _flickerTime = 0;
  var _playerInLab = false;

  var _state = {
    moneyReady: false,
    printerUpgraded: false,
    safeCombFound: false,
    totalEarned: 0,
  };

  // ─── Persistence ──────────────────────────────────────────────────────────────
  function _loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        _state.moneyReady = !!parsed.moneyReady;
        _state.printerUpgraded = !!parsed.printerUpgraded;
        _state.safeCombFound = !!parsed.safeCombFound;
        _state.totalEarned = parsed.totalEarned || 0;
      }
    } catch (e) { /* ignore */ }
  }

  function _saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
    } catch (e) { /* ignore */ }
  }

  // ─── Texture helpers ──────────────────────────────────────────────────────────
  function _makeConcreteTexture(color1, color2, size) {
    size = size || 128;
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, size, size);
    // noise overlay
    for (var i = 0; i < 1200; i++) {
      var x = Math.random() * size;
      var y = Math.random() * size;
      var r = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color2;
      ctx.globalAlpha = Math.random() * 0.25 + 0.05;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  function _makeBrickTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(0, 0, 128, 64);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    // horizontal mortar lines
    for (var row = 0; row < 4; row++) {
      var rowH = 16;
      var y = row * rowH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y);
      ctx.stroke();
      // bricks per row (offset every other)
      var brickW = 32;
      var offset = (row % 2 === 0) ? 0 : 16;
      for (var b = -1; b * brickW + offset < 128 + brickW; b++) {
        var bx = b * brickW + offset;
        ctx.beginPath();
        ctx.moveTo(bx, y);
        ctx.lineTo(bx, y + rowH);
        ctx.stroke();
        // slight colour variation per brick
        ctx.fillStyle = 'rgba(' + (40 + Math.random() * 20 | 0) + ',20,10,' + (Math.random() * 0.3).toFixed(2) + ')';
        ctx.fillRect(bx + 2, y + 2, brickW - 4, rowH - 4);
      }
    }
    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    return tex;
  }

  function _makeMetalTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 64, 64);
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(0.5, '#2e2e2e');
    grad.addColorStop(1, '#141414');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  // ─── Room geometry ────────────────────────────────────────────────────────────
  function _buildRoom(scene) {
    var concreteTex = _makeConcreteTexture('#1a1a1a', '#0d0d0d');
    var brickTex = _makeBrickTexture();

    var floorMat = new THREE.MeshLambertMaterial({ map: concreteTex });
    var brickMat = new THREE.MeshLambertMaterial({ map: brickTex });
    var ceilMat = new THREE.MeshLambertMaterial({
      map: _makeConcreteTexture('#141414', '#0a0a0a'),
    });

    // Floor
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_W, 0.2, ROOM_D),
      floorMat
    );
    floor.position.set(LAB_ROOM.x, LAB_ROOM.y - ROOM_H / 2 + 0.1, LAB_ROOM.z);
    scene.add(floor);
    _labMeshes.push(floor);

    // Ceiling
    var ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_W, 0.2, ROOM_D),
      ceilMat
    );
    ceiling.position.set(LAB_ROOM.x, LAB_ROOM.y + ROOM_H / 2 - 0.1, LAB_ROOM.z);
    scene.add(ceiling);
    _labMeshes.push(ceiling);

    // Walls
    var wallDefs = [
      { size: [0.2, ROOM_H, ROOM_D], pos: [LAB_ROOM.x - ROOM_W / 2, LAB_ROOM.y, LAB_ROOM.z] },
      { size: [0.2, ROOM_H, ROOM_D], pos: [LAB_ROOM.x + ROOM_W / 2, LAB_ROOM.y, LAB_ROOM.z] },
      { size: [ROOM_W, ROOM_H, 0.2], pos: [LAB_ROOM.x, LAB_ROOM.y, LAB_ROOM.z - ROOM_D / 2] },
      { size: [ROOM_W, ROOM_H, 0.2], pos: [LAB_ROOM.x, LAB_ROOM.y, LAB_ROOM.z + ROOM_D / 2] },
    ];
    wallDefs.forEach(function (def) {
      var wall = new THREE.Mesh(
        new THREE.BoxGeometry(def.size[0], def.size[1], def.size[2]),
        brickMat
      );
      wall.position.set(def.pos[0], def.pos[1], def.pos[2]);
      scene.add(wall);
      _labMeshes.push(wall);
    });
  }

  // ─── Hatch (trapdoor) in office ───────────────────────────────────────────────
  function _buildHatch(scene) {
    var metalTex = _makeMetalTexture();
    var hatchMat = new THREE.MeshLambertMaterial({ map: metalTex, color: 0x222222 });
    _hatchMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.08, 1.2),
      hatchMat
    );
    _hatchMesh.position.set(HATCH_POS.x, HATCH_POS.y, HATCH_POS.z);
    // bolt detail (thin strip across hatch)
    var boltMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var bolt = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.1), boltMat);
    bolt.position.set(0, 0.06, 0);
    _hatchMesh.add(bolt);
    scene.add(_hatchMesh);
  }

  // ─── Stairs (built when unlocked) ────────────────────────────────────────────
  function _buildStairs(scene) {
    var stepMat = new THREE.MeshLambertMaterial({
      map: _makeConcreteTexture('#1c1c1c', '#111'),
    });
    var stepCount = 5;
    for (var i = 0; i < stepCount; i++) {
      var step = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.15, 0.4),
        stepMat
      );
      // stairs descend from hatch (y=0) down to lab (y ~ -3)
      var t = i / (stepCount - 1);
      step.position.set(
        HATCH_POS.x,
        -0.15 - i * 0.55,
        HATCH_POS.z - 0.3 - i * 0.45
      );
      scene.add(step);
      _stairMeshes.push(step);
    }
  }

  // ─── Lab furnishings ──────────────────────────────────────────────────────────
  function _buildFurnishings(scene) {
    var rx = LAB_ROOM.x;
    var ry = LAB_ROOM.y;
    var rz = LAB_ROOM.z;
    var floorY = ry - ROOM_H / 2 + 0.2;

    // ── Money printer (2 stacked boxes with green LED glow) ──────────────────
    var printerBaseMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var printerBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.3, 0.4), printerBaseMat
    );
    printerBase.position.set(rx - 2.5, floorY + 0.15, rz - 2);
    scene.add(printerBase);
    _labMeshes.push(printerBase);

    var printerTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.2, 0.35), printerBaseMat
    );
    printerTop.position.set(rx - 2.5, floorY + 0.45, rz - 2);
    scene.add(printerTop);
    _labMeshes.push(printerTop);

    // Green LED strip on printer
    var ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
    var led = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.04), ledMat);
    led.position.set(rx - 2.5, floorY + 0.57, rz - 1.82);
    scene.add(led);
    _labMeshes.push(led);

    // Green point light from printer
    var printerLight = new THREE.PointLight(0x00ff44, 0.4, 2.5);
    printerLight.position.set(rx - 2.5, floorY + 0.6, rz - 2);
    scene.add(printerLight);
    _labMeshes.push(printerLight);

    // ── Hidden safe on east wall ──────────────────────────────────────────────
    var safeMat = new THREE.MeshLambertMaterial({ color: 0x1e2b1e });
    var safe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1), safeMat);
    safe.position.set(rx + ROOM_W / 2 - 0.12, ry - 0.2, rz);
    scene.add(safe);
    _labMeshes.push(safe);

    // Combination dial
    var dialMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var dial = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12), dialMat);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(rx + ROOM_W / 2 - 0.08, ry - 0.2, rz);
    scene.add(dial);
    _labMeshes.push(dial);

    // ── Chemical shelf ────────────────────────────────────────────────────────
    var shelfMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
    var shelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.3), shelfMat);
    shelf.position.set(rx + 2, floorY + 1.1, rz - ROOM_D / 2 + 0.2);
    scene.add(shelf);
    _labMeshes.push(shelf);

    var bottleColors = [0x00aa44, 0x2255cc, 0xddcc00, 0xcc3300];
    bottleColors.forEach(function (col, i) {
      var bottleMat = new THREE.MeshLambertMaterial({ color: col, transparent: true, opacity: 0.75 });
      var bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.22, 8), bottleMat);
      bottle.position.set(rx + 1.5 + i * 0.32, floorY + 1.24, rz - ROOM_D / 2 + 0.2);
      scene.add(bottle);
      _labMeshes.push(bottle);
    });

    // ── Work table with papers/bags ───────────────────────────────────────────
    var tableMat = new THREE.MeshLambertMaterial({ color: 0x2a1e0e });
    var table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.7), tableMat);
    table.position.set(rx - 1, floorY + 0.75, rz + 2.5);
    scene.add(table);
    _labMeshes.push(table);

    // Table legs
    [[-0.8, 0.75], [0.8, 0.75], [-0.8, -0.3], [0.8, -0.3]].forEach(function (off) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.06), tableMat);
      leg.position.set(rx - 1 + off[0], floorY + 0.375, rz + 2.5 + off[1]);
      scene.add(leg);
      _labMeshes.push(leg);
    });

    // Papers on table
    var paperMat = new THREE.MeshLambertMaterial({ color: 0xd0c8a0 });
    var papers = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.01, 0.25), paperMat);
    papers.position.set(rx - 1.2, floorY + 0.79, rz + 2.4);
    scene.add(papers);
    _labMeshes.push(papers);

    var bagMat = new THREE.MeshLambertMaterial({ color: 0xc8b46e });
    var bag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.12), bagMat);
    bag.position.set(rx - 0.6, floorY + 0.8, rz + 2.6);
    scene.add(bag);
    _labMeshes.push(bag);

    // ── Old CRT monitor ───────────────────────────────────────────────────────
    var crtBodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a0e });
    var crtBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.38), crtBodyMat);
    crtBody.position.set(rx + 2.2, floorY + 0.96, rz + 2);
    scene.add(crtBody);
    _labMeshes.push(crtBody);

    var crtScreenMat = new THREE.MeshBasicMaterial({ color: 0x003355 });
    var crtScreen = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.02), crtScreenMat);
    crtScreen.position.set(rx + 2.2, floorY + 0.98, rz + 2 - 0.2);
    scene.add(crtScreen);
    _labMeshes.push(crtScreen);

    // Blue glow from CRT
    var crtLight = new THREE.PointLight(0x0066aa, 0.35, 2.0);
    crtLight.position.set(rx + 2.2, floorY + 1.0, rz + 1.7);
    scene.add(crtLight);
    _labMeshes.push(crtLight);

    // ── Hanging bare lightbulb ────────────────────────────────────────────────
    var cordMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.8, 4), cordMat);
    cord.position.set(rx, ry + ROOM_H / 2 - 0.5, rz);
    scene.add(cord);
    _labMeshes.push(cord);

    var bulbMat = new THREE.MeshBasicMaterial({ color: 0xffcc66 });
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), bulbMat);
    bulb.position.set(rx, ry + ROOM_H / 2 - 0.95, rz);
    scene.add(bulb);
    _labMeshes.push(bulb);

    _bulbLight = new THREE.PointLight(0xFF8800, 0.8, 8);
    _bulbLight.position.set(rx, ry + ROOM_H / 2 - 1.0, rz);
    scene.add(_bulbLight);
    _labMeshes.push(_bulbLight);

    // ── Emergency exit ladder at far wall ─────────────────────────────────────
    var ladderMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    // Vertical rails
    [-0.2, 0.2].forEach(function (xOff) {
      var rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, ROOM_H * 0.8, 0.04), ladderMat);
      rail.position.set(rx + xOff, ry, rz - ROOM_D / 2 + 0.12);
      scene.add(rail);
      _labMeshes.push(rail);
    });
    // Rungs
    for (var r = 0; r < 6; r++) {
      var rung = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.04), ladderMat);
      rung.position.set(rx, ry - ROOM_H * 0.35 + r * 0.46, rz - ROOM_D / 2 + 0.12);
      scene.add(rung);
      _labMeshes.push(rung);
    }
  }

  // ─── Visibility toggle ────────────────────────────────────────────────────────
  function _setLabVisible(visible) {
    _labMeshes.forEach(function (m) {
      m.visible = visible;
    });
  }

  // ─── Proximity check ─────────────────────────────────────────────────────────
  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  var _module = {

    LAB_ROOM: LAB_ROOM,

    init: function (scene, colliders, ROOM) {
      _scene = scene;
      _loadState();

      _buildHatch(scene);
      _buildRoom(scene);
      _buildFurnishings(scene);

      // Lab hidden until unlocked
      _setLabVisible(false);
      _hatchMesh.visible = true;    // hatch cover always visible in office

      // Push hatch into colliders list if provided
      if (Array.isArray(colliders)) {
        colliders.push(_hatchMesh);
      }
    },

    unlock: function (scene) {
      if (_unlocked) return;
      _unlocked = true;

      // Swing hatch open (rotate 90° around X axis)
      if (_hatchMesh) {
        _hatchMesh.rotation.x = -Math.PI / 2;
        _hatchMesh.position.y += 0.6;   // pivot up so it looks open
      }

      // Build and show stairs
      _buildStairs(scene || _scene);

      // Reveal lab
      _setLabVisible(true);

      // Mark game state if available
      if (window.gameState) {
        window.gameState.labUnlocked = true;
      }

      _saveState();
    },

    isUnlocked: function () {
      return _unlocked;
    },

    update: function (delta, playerPos) {
      var events = [];
      if (!playerPos) return events;

      // ── Lightbulb flicker ──────────────────────────────────────────────────
      if (_bulbLight && _unlocked) {
        _flickerTime += delta;
        // ~2 Hz oscillation with slight noise
        var flicker = Math.sin(_flickerTime * 12.5) * 0.08
          + Math.sin(_flickerTime * 7.3 + 1.2) * 0.07;
        _bulbLight.intensity = 0.8 + flicker;
      }

      // ── Near hatch in office ──────────────────────────────────────────────
      var nearHatch = _dist2D(playerPos, HATCH_POS) < 1.5;
      if (nearHatch && !_unlocked) {
        events.push({ type: 'near_hatch_locked' });
      }
      if (nearHatch && _unlocked) {
        events.push({ type: 'near_hatch_open' });
      }

      // ── Player in lab ─────────────────────────────────────────────────────
      if (_unlocked) {
        var inLab = (
          Math.abs(playerPos.x - LAB_ROOM.x) < ROOM_W / 2 + 0.5 &&
          Math.abs(playerPos.z - LAB_ROOM.z) < ROOM_D / 2 + 0.5 &&
          playerPos.y < -1
        );

        if (inLab && !_playerInLab) {
          _playerInLab = true;
          events.push({ type: 'entered_lab' });
        } else if (!inLab && _playerInLab) {
          _playerInLab = false;
          events.push({ type: 'left_lab' });
        }

        if (inLab) {
          events.push({ type: 'in_lab', actions: _module.getLabActions() });
        }

        // ── Check money printer (passive income per game day) ──────────────
        if (window.gameState && window.gameState.day) {
          var lastDay = _state._lastMoneyDay || 0;
          if (window.gameState.day > lastDay) {
            _state.moneyReady = true;
            _state._lastMoneyDay = window.gameState.day;
            _saveState();
            events.push({ type: 'money_ready', amount: _state.printerUpgraded ? 100 : 50 });
          }
        }
      }

      return events;
    },

    // ── Process lab actions ────────────────────────────────────────────────────
    doAction: function (actionId) {
      var result = { success: false, message: '' };

      if (actionId === 'collect_money') {
        if (_state.moneyReady) {
          var amount = _state.printerUpgraded ? 100 : 50;
          _state.moneyReady = false;
          _state.totalEarned += amount;
          _saveState();
          if (window.gameState) {
            window.gameState.money = (window.gameState.money || 0) + amount;
          }
          result.success = true;
          result.message = '+' + amount + '€ eingesammelt.';
          result.amount = amount;
        } else {
          result.message = 'Der Drucker arbeitet noch...';
        }
      }

      if (actionId === 'upgrade_printer') {
        var cost = 500;
        var funds = (window.gameState && window.gameState.money) || 0;
        if (_state.printerUpgraded) {
          result.message = 'Drucker bereits verbessert.';
        } else if (funds >= cost) {
          _state.printerUpgraded = true;
          _saveState();
          if (window.gameState) window.gameState.money -= cost;
          result.success = true;
          result.message = 'Drucker verbessert! Verdient jetzt 100€/Tag.';
        } else {
          result.message = 'Nicht genug Geld (' + cost + '€ benötigt).';
        }
      }

      if (actionId === 'check_safe') {
        if (_state.safeCombFound) {
          result.success = true;
          result.message = 'Du öffnest den Tresor... (Inhalt gefunden)';
          if (window.gameState) {
            window.gameState.safeOpened = true;
          }
        } else {
          result.message = 'Du kennst die Kombination noch nicht.';
        }
      }

      return result;
    },

    // Call from game when player finds safe combination elsewhere
    setSafeCombFound: function (val) {
      _state.safeCombFound = !!val;
      _saveState();
    },

    getLabActions: function () {
      return [
        {
          id: 'collect_money',
          label: 'Geld einsammeln (' + (_state.printerUpgraded ? 100 : 50) + '€)',
          available: _state.moneyReady,
        },
        {
          id: 'upgrade_printer',
          label: 'Drucker verbessern (500€)',
          available: !_state.printerUpgraded,
        },
        {
          id: 'check_safe',
          label: 'Tresor öffnen',
          available: _state.safeCombFound,
        },
      ];
    },

    getState: function () {
      return Object.assign({}, _state);
    },

    // Force money ready (e.g. called by game-day-tick handler)
    triggerDayTick: function () {
      _state.moneyReady = true;
      _saveState();
    },
  };

  return _module;
}());
