/* world.js - Pizza Empire 3D World Builder
 * Uses Three.js globals (THREE available globally)
 * IIFE pattern - no ES modules
 */
var World = (function () {
  'use strict';

  // ── internal state ──────────────────────────────────────────────────────────
  var _scene, _renderer, _clock;
  var _ambientLight, _sunLight, _skyMesh;
  var _pendantLights = [];
  var _colliders = [];
  var _linkedCamera = null;

  // Room anchor positions (exported)
  var ROOM = {
    exterior: { x: 0, z: 0 },
    dining:   { x: 0, z: -20 },
    kitchen:  { x: 0, z: -36 },
    office:   { x: 9, z: -36 }
  };

  // ── texture factories ────────────────────────────────────────────────────────
  function makeBrickTexture() {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#A0522D';
    var bw = 42, bh = 20, mortar = 4;
    for (var row = 0; row < 14; row++) {
      var offset = (row % 2 === 0) ? 0 : bw / 2;
      for (var col = -1; col < 7; col++) {
        var x = col * (bw + mortar) + offset;
        var y = row * (bh + mortar);
        ctx.fillRect(x + mortar, y + mortar, bw, bh);
        // slight color variation
        ctx.fillStyle = (row * col) % 3 === 0 ? '#9B4520' : '#A0522D';
      }
    }
    ctx.strokeStyle = '#5C3317';
    ctx.lineWidth = mortar;
    for (var r = 0; r <= 14; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * (bh + mortar));
      ctx.lineTo(256, r * (bh + mortar));
      ctx.stroke();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 4);
    return t;
  }

  function makeCheckerTexture() {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var ctx = c.getContext('2d');
    var tileSize = 32;
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#F5F0E0' : '#C8B89A';
        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
      }
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 5);
    return t;
  }

  function makeWoodTexture() {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 40; i++) {
      var y = (i / 40) * 256;
      ctx.strokeStyle = 'rgba(0,0,0,' + (0.05 + Math.random() * 0.1) + ')';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(64, y + (Math.random()-0.5)*4, 192, y + (Math.random()-0.5)*4, 256, y);
      ctx.stroke();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    return t;
  }

  function makeConcreteTexture() {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 2000; i++) {
      var nx = Math.random() * 256;
      var ny = Math.random() * 256;
      var v = Math.floor(Math.random() * 40 - 20);
      var r = 158 + v, g = 158 + v, b = 158 + v;
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(nx, ny, 2, 2);
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    return t;
  }

  function makeTileTexture() {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#BDBDBD';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;
    var ts = 32;
    for (var x = 0; x <= 256; x += ts) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
    }
    for (var y = 0; y <= 256; y += ts) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 4);
    return t;
  }

  function makeCarpetTexture() {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#5D3A6B';
    ctx.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 3000; i++) {
      var nx = Math.random() * 256, ny = Math.random() * 256;
      ctx.fillStyle = 'rgba(' + Math.floor(Math.random()*60+80) + ',0,' + Math.floor(Math.random()*60+100) + ',0.4)';
      ctx.fillRect(nx, ny, 1, 2);
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    return t;
  }

  // ── collider helper ─────────────────────────────────────────────────────────
  function addCollider(minX, maxX, minY, maxY, minZ, maxZ) {
    _colliders.push({ minX: minX, maxX: maxX, minY: minY, maxY: maxY, minZ: minZ, maxZ: maxZ });
  }

  function boxCollider(mesh, wx, wy, wz) {
    var p = mesh.position;
    addCollider(p.x - wx/2, p.x + wx/2, p.y - wy/2, p.y + wy/2, p.z - wz/2, p.z + wz/2);
  }

  // ── geometry helpers ────────────────────────────────────────────────────────
  function makeBox(w, h, d, mat) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function makePlane(w, h, mat) {
    var geo = new THREE.PlaneGeometry(w, h);
    return new THREE.Mesh(geo, mat);
  }

  // ── sky sphere ──────────────────────────────────────────────────────────────
  function buildSky() {
    var geo = new THREE.SphereGeometry(120, 16, 16);
    var mat = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
    _skyMesh = new THREE.Mesh(geo, mat);
    _scene.add(_skyMesh);
  }

  // ── exterior ────────────────────────────────────────────────────────────────
  function buildExterior() {
    var ex = ROOM.exterior;

    // Street / ground plane
    var streetMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var street = makePlane(80, 80, streetMat);
    street.rotation.x = -Math.PI / 2;
    street.position.set(ex.x, 0, ex.z);
    street.receiveShadow = true;
    _scene.add(street);

    // Sidewalk strip in front of restaurant
    var sidewalkMat = new THREE.MeshLambertMaterial({ color: 0xB0A090 });
    var sidewalk = makePlane(16, 8, sidewalkMat);
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(ex.x, 0.01, ex.z + 4);
    sidewalk.receiveShadow = true;
    _scene.add(sidewalk);

    // Building facade
    var brickTex = makeBrickTexture();
    var facadeMat = new THREE.MeshLambertMaterial({ map: brickTex });

    // Left wall panel
    var leftPanel = makeBox(5.5, 5, 0.3, facadeMat);
    leftPanel.position.set(ex.x - 4.75, 2.5, ex.z - 1.15);
    _scene.add(leftPanel);
    addCollider(ex.x - 7.5, ex.x - 2, 0, 5, ex.z - 1.45, ex.z - 0.85);

    // Right wall panel
    var rightPanel = makeBox(5.5, 5, 0.3, facadeMat);
    rightPanel.position.set(ex.x + 4.75, 2.5, ex.z - 1.15);
    _scene.add(rightPanel);
    addCollider(ex.x + 2, ex.x + 7.5, 0, 5, ex.z - 1.45, ex.z - 0.85);

    // Top beam above door
    var topBeam = makeBox(13, 1, 0.3, facadeMat);
    topBeam.position.set(ex.x, 4.5, ex.z - 1.15);
    _scene.add(topBeam);

    // Door frame left post
    var dfl = makeBox(0.3, 4, 0.35, new THREE.MeshLambertMaterial({ color: 0x5C4033 }));
    dfl.position.set(ex.x - 1.35, 2, ex.z - 1.15);
    _scene.add(dfl);

    // Door frame right post
    var dfr = makeBox(0.3, 4, 0.35, new THREE.MeshLambertMaterial({ color: 0x5C4033 }));
    dfr.position.set(ex.x + 1.35, 2, ex.z - 1.15);
    _scene.add(dfr);

    // Glowing pizza sign
    var signCanvas = document.createElement('canvas');
    signCanvas.width = 512; signCanvas.height = 128;
    var sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#1A0A00';
    sctx.fillRect(0, 0, 512, 128);
    sctx.shadowBlur = 20;
    sctx.shadowColor = '#FF6600';
    sctx.fillStyle = '#FF9900';
    sctx.font = 'bold 64px Arial';
    sctx.textAlign = 'center';
    sctx.fillText('PIZZA EMPIRE', 256, 80);
    var signTex = new THREE.CanvasTexture(signCanvas);
    var signMat = new THREE.MeshBasicMaterial({ map: signTex });
    var sign = makePlane(4.5, 1.1, signMat);
    sign.position.set(ex.x, 4.0, ex.z - 1.0);
    _scene.add(sign);

    // Sign glow point light
    var signGlow = new THREE.PointLight(0xFF8800, 1.2, 8);
    signGlow.position.set(ex.x, 4.0, ex.z - 0.5);
    _scene.add(signGlow);

    // Left streetlamp
    buildStreetLamp(ex.x - 7, ex.z + 3);
    // Right streetlamp
    buildStreetLamp(ex.x + 7, ex.z + 3);

    // Background buildings (just boxes)
    var bgMat = new THREE.MeshLambertMaterial({ color: 0x6B6B6B });
    var bg1 = makeBox(12, 18, 8, bgMat);
    bg1.position.set(ex.x - 20, 9, ex.z - 15);
    _scene.add(bg1);
    var bg2 = makeBox(10, 24, 8, bgMat);
    bg2.position.set(ex.x + 22, 12, ex.z - 18);
    _scene.add(bg2);
    var bg3 = makeBox(14, 12, 8, bgMat);
    bg3.position.set(ex.x - 30, 6, ex.z - 10);
    _scene.add(bg3);
    // Background building windows
    var winMat = new THREE.MeshBasicMaterial({ color: 0xFFFF99 });
    for (var bi = 0; bi < 12; bi++) {
      var win = makePlane(1, 1.2, winMat);
      win.position.set(ex.x - 20 + (bi % 3 - 1) * 3, 4 + Math.floor(bi / 3) * 3.5, ex.z - 11);
      _scene.add(win);
    }
  }

  function buildStreetLamp(x, z) {
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var pole = makeBox(0.15, 5, 0.15, poleMat);
    pole.position.set(x, 2.5, z);
    _scene.add(pole);

    var arm = makeBox(1.5, 0.1, 0.1, poleMat);
    arm.position.set(x + 0.75, 5.1, z);
    _scene.add(arm);

    var headMat = new THREE.MeshBasicMaterial({ color: 0xFFFF88 });
    var head = makeBox(0.4, 0.25, 0.4, headMat);
    head.position.set(x + 1.55, 5.1, z);
    _scene.add(head);

    var lamp = new THREE.PointLight(0xFFEE99, 1.5, 14);
    lamp.position.set(x + 1.55, 5.0, z);
    lamp.castShadow = false;
    _scene.add(lamp);
  }

  // ── dining room ─────────────────────────────────────────────────────────────
  function buildDiningRoom() {
    var dr = ROOM.dining;
    var W = 12, H = 4, D = 14;

    var floorTex = makeCheckerTexture();
    var floorMat = new THREE.MeshLambertMaterial({ map: floorTex });
    var floor = makePlane(W, D, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(dr.x, 0, dr.z);
    floor.receiveShadow = true;
    _scene.add(floor);

    var wallMat = new THREE.MeshLambertMaterial({ color: 0xF5ECD7 });
    var wallMatB = new THREE.MeshLambertMaterial({ map: makeBrickTexture() });

    // Back wall (toward kitchen)
    var backWall = makeBox(W, H, 0.2, wallMat);
    backWall.position.set(dr.x, H/2, dr.z - D/2);
    _scene.add(backWall);
    addCollider(dr.x - W/2, dr.x + W/2, 0, H, dr.z - D/2 - 0.1, dr.z - D/2 + 0.1);

    // Front wall with door opening
    var fwL = makeBox(4.5, H, 0.2, wallMat);
    fwL.position.set(dr.x - 3.75, H/2, dr.z + D/2);
    _scene.add(fwL);
    addCollider(dr.x - W/2, dr.x - 1.5, 0, H, dr.z + D/2 - 0.1, dr.z + D/2 + 0.1);

    var fwR = makeBox(4.5, H, 0.2, wallMat);
    fwR.position.set(dr.x + 3.75, H/2, dr.z + D/2);
    _scene.add(fwR);
    addCollider(dr.x + 1.5, dr.x + W/2, 0, H, dr.z + D/2 - 0.1, dr.z + D/2 + 0.1);

    // Top of front door opening
    var fwTop = makeBox(3, H * 0.25, 0.2, wallMat);
    fwTop.position.set(dr.x, H * 0.875, dr.z + D/2);
    _scene.add(fwTop);

    // Left wall
    var leftWall = makeBox(0.2, H, D, wallMat);
    leftWall.position.set(dr.x - W/2, H/2, dr.z);
    _scene.add(leftWall);
    addCollider(dr.x - W/2 - 0.1, dr.x - W/2 + 0.1, 0, H, dr.z - D/2, dr.z + D/2);

    // Right wall
    var rightWall = makeBox(0.2, H, D, wallMat);
    rightWall.position.set(dr.x + W/2, H/2, dr.z);
    _scene.add(rightWall);
    addCollider(dr.x + W/2 - 0.1, dr.x + W/2 + 0.1, 0, H, dr.z - D/2, dr.z + D/2);

    // Ceiling
    var ceilMat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
    var ceil = makePlane(W, D, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(dr.x, H, dr.z);
    _scene.add(ceil);

    // Back wall kitchen door opening
    var kwL = makeBox(4, H, 0.2, wallMat);
    kwL.position.set(dr.x - 4, H/2, dr.z - D/2);
    _scene.add(kwL);
    var kwR = makeBox(4, H, 0.2, wallMat);
    kwR.position.set(dr.x + 4, H/2, dr.z - D/2);
    _scene.add(kwR);
    var kwTop = makeBox(4, H * 0.25, 0.2, wallMat);
    kwTop.position.set(dr.x, H * 0.875, dr.z - D/2);
    _scene.add(kwTop);
    addCollider(dr.x - W/2, dr.x - 2, 0, H, dr.z - D/2 - 0.1, dr.z - D/2 + 0.1);
    addCollider(dr.x + 2, dr.x + W/2, 0, H, dr.z - D/2 - 0.1, dr.z - D/2 + 0.1);

    // Menu board
    var menuCanvas = document.createElement('canvas');
    menuCanvas.width = 512; menuCanvas.height = 384;
    var mctx = menuCanvas.getContext('2d');
    mctx.fillStyle = '#1A0A00';
    mctx.fillRect(0, 0, 512, 384);
    mctx.fillStyle = '#FFD700';
    mctx.font = 'bold 36px Arial';
    mctx.textAlign = 'center';
    mctx.fillText('MENU', 256, 50);
    mctx.fillStyle = '#FFFFFF';
    mctx.font = '24px Arial';
    var items = ['Margherita  $12', 'Pepperoni  $14', 'Supreme  $16', 'Calzone  $13', 'Garlic Bread  $5', 'Soda  $3'];
    items.forEach(function(item, i) { mctx.fillText(item, 256, 100 + i * 40); });
    var menuTex = new THREE.CanvasTexture(menuCanvas);
    var menuBoard = makePlane(3, 2.2, new THREE.MeshBasicMaterial({ map: menuTex }));
    menuBoard.position.set(dr.x + 4, 2.5, dr.z + D/2 - 0.05);
    menuBoard.rotation.y = Math.PI;
    _scene.add(menuBoard);

    // Counter/bar
    var counterMat = new THREE.MeshLambertMaterial({ map: makeWoodTexture() });
    var counter = makeBox(4, 1.1, 0.8, counterMat);
    counter.position.set(dr.x - 3.5, 0.55, dr.z - D/2 + 1.5);
    _scene.add(counter);
    addCollider(dr.x - 5.5, dr.x - 1.5, 0, 1.1, dr.z - D/2 + 1.1, dr.z - D/2 + 1.9);

    // Bar stools
    for (var s = 0; s < 3; s++) {
      var stool = makeBox(0.35, 0.65, 0.35, new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
      stool.position.set(dr.x - 4.5 + s * 1.2, 0.32, dr.z - D/2 + 2.5);
      _scene.add(stool);
    }

    // 6 tables with 4 chairs each
    var tablePositions = [
      { x: dr.x - 3,   z: dr.z - 3 },
      { x: dr.x + 3,   z: dr.z - 3 },
      { x: dr.x - 3,   z: dr.z },
      { x: dr.x + 3,   z: dr.z },
      { x: dr.x - 3,   z: dr.z + 3.5 },
      { x: dr.x + 3,   z: dr.z + 3.5 }
    ];
    tablePositions.forEach(function(tp) {
      buildDiningTable(tp.x, tp.z);
    });

    // Pendant lights
    var pendantPositions = [
      { x: dr.x - 3, z: dr.z - 3 }, { x: dr.x + 3, z: dr.z - 3 },
      { x: dr.x,     z: dr.z     }, { x: dr.x - 3, z: dr.z + 3 },
      { x: dr.x + 3, z: dr.z + 3 }
    ];
    pendantPositions.forEach(function(pp) {
      var cord = makeBox(0.04, 0.8, 0.04, new THREE.MeshBasicMaterial({ color: 0x333333 }));
      cord.position.set(pp.x, H - 0.4, pp.z);
      _scene.add(cord);
      var shade = makeBox(0.4, 0.25, 0.4, new THREE.MeshBasicMaterial({ color: 0xFF6600 }));
      shade.position.set(pp.x, H - 0.9, pp.z);
      _scene.add(shade);
      var pl = new THREE.PointLight(0xFFCC88, 0.9, 7);
      pl.position.set(pp.x, H - 1.0, pp.z);
      _scene.add(pl);
      _pendantLights.push(pl);
    });

    // Baseboard trim
    var trimMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var trimL = makeBox(0.1, 0.2, D, trimMat);
    trimL.position.set(dr.x - W/2 + 0.05, 0.1, dr.z);
    _scene.add(trimL);
    var trimR = makeBox(0.1, 0.2, D, trimMat);
    trimR.position.set(dr.x + W/2 - 0.05, 0.1, dr.z);
    _scene.add(trimR);
  }

  function buildDiningTable(x, z) {
    var woodMat = new THREE.MeshLambertMaterial({ map: makeWoodTexture() });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });

    // Tabletop
    var top = makeBox(1.6, 0.1, 1.0, woodMat);
    top.position.set(x, 0.8, z);
    _scene.add(top);
    addCollider(x - 0.8, x + 0.8, 0, 0.9, z - 0.5, z + 0.5);

    // Table legs
    var legOffsets = [[-0.65, -0.4], [0.65, -0.4], [-0.65, 0.4], [0.65, 0.4]];
    legOffsets.forEach(function(lo) {
      var leg = makeBox(0.08, 0.78, 0.08, darkMat);
      leg.position.set(x + lo[0], 0.39, z + lo[1]);
      _scene.add(leg);
    });

    // 4 chairs
    var chairOffsets = [
      { dx: 0,    dz: -1.0, ry: 0 },
      { dx: 0,    dz:  1.0, ry: Math.PI },
      { dx: -1.1, dz:  0,   ry: Math.PI / 2 },
      { dx:  1.1, dz:  0,   ry: -Math.PI / 2 }
    ];
    chairOffsets.forEach(function(co) {
      buildChair(x + co.dx, z + co.dz, co.ry);
    });

    // Place setting (plate indicator)
    var plateMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    var plate = makeBox(0.3, 0.02, 0.3, plateMat);
    plate.position.set(x, 0.86, z);
    _scene.add(plate);
  }

  function buildChair(x, z, ry) {
    var mat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    var woodMat = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });

    // Seat
    var seat = makeBox(0.55, 0.08, 0.55, mat);
    seat.position.set(x, 0.48, z);
    seat.rotation.y = ry;
    _scene.add(seat);

    // Back
    var back = makeBox(0.55, 0.5, 0.06, mat);
    back.position.set(x + Math.sin(ry) * 0.25, 0.74, z + Math.cos(ry) * 0.25);
    back.rotation.y = ry;
    _scene.add(back);

    // Legs
    var legO = [[0.22, 0.22], [-0.22, 0.22], [0.22, -0.22], [-0.22, -0.22]];
    legO.forEach(function(lo) {
      var leg = makeBox(0.05, 0.46, 0.05, woodMat);
      leg.position.set(x + lo[0], 0.23, z + lo[1]);
      _scene.add(leg);
    });
  }

  // ── kitchen ─────────────────────────────────────────────────────────────────
  function buildKitchen() {
    var kr = ROOM.kitchen;
    var W = 10, H = 3.5, D = 10;

    var floorMat = new THREE.MeshLambertMaterial({ map: makeTileTexture() });
    var floor = makePlane(W, D, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(kr.x, 0, kr.z);
    floor.receiveShadow = true;
    _scene.add(floor);

    var wallMat = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });

    // Walls
    ['back', 'left', 'right'].forEach(function(side) {
      var w, h, d, px, pz;
      if (side === 'back') {
        w = W; h = H; d = 0.2;
        px = kr.x; pz = kr.z - D/2;
        addCollider(kr.x - W/2, kr.x + W/2, 0, H, pz - 0.1, pz + 0.1);
      } else if (side === 'left') {
        w = 0.2; h = H; d = D;
        px = kr.x - W/2; pz = kr.z;
        addCollider(px - 0.1, px + 0.1, 0, H, kr.z - D/2, kr.z + D/2);
      } else {
        // Right wall has opening to office
        w = 0.2; h = H; d = D;
        px = kr.x + W/2; pz = kr.z;
        addCollider(px - 0.1, px + 0.1, 0, H, kr.z - D/2, kr.z + D/2);
      }
      var wall = makeBox(w, h, d, wallMat);
      wall.position.set(px, h/2, pz);
      _scene.add(wall);
    });

    // Ceiling
    var ceil = makePlane(W, D, new THREE.MeshLambertMaterial({ color: 0xEEEEEE }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(kr.x, H, kr.z);
    _scene.add(ceil);

    // 2 pizza ovens
    buildPizzaOven(kr.x - 3, kr.z - D/2 + 0.8);
    buildPizzaOven(kr.x + 1, kr.z - D/2 + 0.8);

    // Prep table
    var prepMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    var prepTable = makeBox(3.5, 0.1, 0.9, prepMat);
    prepTable.position.set(kr.x - 0.5, 1.0, kr.z + 1.5);
    _scene.add(prepTable);
    var prepLeg1 = makeBox(0.08, 1.0, 0.08, prepMat);
    prepLeg1.position.set(kr.x - 2.2, 0.5, kr.z + 1.1);
    _scene.add(prepLeg1);
    var prepLeg2 = makeBox(0.08, 1.0, 0.08, prepMat);
    prepLeg2.position.set(kr.x + 1.2, 0.5, kr.z + 1.1);
    _scene.add(prepLeg2);
    addCollider(kr.x - 2.3, kr.x + 1.3, 0, 1.1, kr.z + 1.0, kr.z + 2.0);

    // Steel shelves with cans
    buildShelves(kr.x + W/2 - 0.5, kr.z);

    // Fluorescent ceiling lights
    var florMat = new THREE.MeshBasicMaterial({ color: 0xEEFFFF });
    for (var f = 0; f < 2; f++) {
      var fTube = makeBox(3, 0.1, 0.15, florMat);
      fTube.position.set(kr.x - 1.5 + f * 3, H - 0.05, kr.z);
      _scene.add(fTube);
      var fl = new THREE.PointLight(0xDDEEFF, 1.0, 9);
      fl.position.set(kr.x - 1.5 + f * 3, H - 0.3, kr.z);
      _scene.add(fl);
    }

    // Sink
    var sinkMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
    var sink = makeBox(0.8, 0.15, 0.6, sinkMat);
    sink.position.set(kr.x + 3.5, 1.0, kr.z + D/2 - 0.8);
    _scene.add(sink);
    addCollider(kr.x + 3.0, kr.x + 4.0, 0, 1.2, kr.z + D/2 - 1.1, kr.z + D/2 - 0.5);
  }

  function buildPizzaOven(x, z) {
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var body = makeBox(1.6, 1.4, 1.2, bodyMat);
    body.position.set(x, 0.7, z);
    _scene.add(body);
    addCollider(x - 0.8, x + 0.8, 0, 1.4, z - 0.6, z + 0.6);

    // Oven door (opening)
    var doorMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    var door = makePlane(0.8, 0.6, doorMat);
    door.position.set(x, 0.7, z + 0.61);
    _scene.add(door);

    // Orange glow inside
    var glowMat = new THREE.MeshBasicMaterial({ color: 0xFF4400 });
    var glow = makePlane(0.7, 0.5, glowMat);
    glow.position.set(x, 0.7, z + 0.605);
    _scene.add(glow);

    var ovenLight = new THREE.PointLight(0xFF5500, 1.5, 4);
    ovenLight.position.set(x, 0.7, z + 0.7);
    _scene.add(ovenLight);

    // Chimney
    var chimney = makeBox(0.25, 0.5, 0.25, bodyMat);
    chimney.position.set(x, 1.65, z);
    _scene.add(chimney);

    // Temperature knobs
    var knobMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    for (var k = 0; k < 3; k++) {
      var knob = makeBox(0.12, 0.12, 0.06, knobMat);
      knob.position.set(x - 0.4 + k * 0.4, 1.25, z + 0.61);
      _scene.add(knob);
    }
  }

  function buildShelves(x, z) {
    var shelfMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
    for (var s = 0; s < 3; s++) {
      var shelf = makeBox(0.1, 0.04, 2.5, shelfMat);
      shelf.position.set(x, 0.5 + s * 0.6, z);
      _scene.add(shelf);
    }
    // Vertical supports
    for (var v = 0; v < 2; v++) {
      var sup = makeBox(0.06, 2.0, 0.06, shelfMat);
      sup.position.set(x, 1.0, z - 1.0 + v * 2.0);
      _scene.add(sup);
    }
    addCollider(x - 0.1, x + 0.1, 0, 2.1, z - 1.3, z + 1.3);

    // Cans on shelves
    var canColors = [0xCC0000, 0x008800, 0x0000CC, 0xFF8800, 0xAA00AA];
    for (var c = 0; c < 8; c++) {
      var canMat = new THREE.MeshLambertMaterial({ color: canColors[c % canColors.length] });
      var can = makeBox(0.14, 0.2, 0.14, canMat);
      can.position.set(x - 0.02, 0.6 + Math.floor(c / 4) * 0.6, z - 0.9 + (c % 4) * 0.55);
      _scene.add(can);
    }
  }

  // ── office ──────────────────────────────────────────────────────────────────
  function buildOffice() {
    var or = ROOM.office;
    var W = 6, H = 3.5, D = 8;

    var carpetTex = makeCarpetTexture();
    var floor = makePlane(W, D, new THREE.MeshLambertMaterial({ map: carpetTex }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(or.x, 0, or.z);
    _scene.add(floor);

    var wallMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

    // Walls
    var offWalls = [
      { w: W,   h: H, d: 0.2, px: or.x,       pz: or.z - D/2 },
      { w: 0.2, h: H, d: D,   px: or.x - W/2,  pz: or.z       },
      { w: 0.2, h: H, d: D,   px: or.x + W/2,  pz: or.z       }
    ];
    offWalls.forEach(function(ow) {
      var wall = makeBox(ow.w, ow.h, ow.d, wallMat);
      wall.position.set(ow.px, ow.h/2, ow.pz);
      _scene.add(wall);
    });
    addCollider(or.x - W/2, or.x + W/2, 0, H, or.z - D/2 - 0.1, or.z - D/2 + 0.1);
    addCollider(or.x - W/2 - 0.1, or.x - W/2 + 0.1, 0, H, or.z - D/2, or.z + D/2);
    addCollider(or.x + W/2 - 0.1, or.x + W/2 + 0.1, 0, H, or.z - D/2, or.z + D/2);

    // Entrance wall (front) with door opening
    var offFwL = makeBox(1.5, H, 0.2, wallMat);
    offFwL.position.set(or.x - 2.25, H/2, or.z + D/2);
    _scene.add(offFwL);
    addCollider(or.x - W/2, or.x - 1.5, 0, H, or.z + D/2 - 0.1, or.z + D/2 + 0.1);
    var offFwR = makeBox(1.5, H, 0.2, wallMat);
    offFwR.position.set(or.x + 2.25, H/2, or.z + D/2);
    _scene.add(offFwR);
    addCollider(or.x + 1.5, or.x + W/2, 0, H, or.z + D/2 - 0.1, or.z + D/2 + 0.1);

    // Ceiling
    var ceil = makePlane(W, D, new THREE.MeshLambertMaterial({ color: 0xDDD8CC }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(or.x, H, or.z);
    _scene.add(ceil);

    // Desk
    var deskMat = new THREE.MeshLambertMaterial({ map: makeWoodTexture() });
    var deskTop = makeBox(2.4, 0.1, 1.2, deskMat);
    deskTop.position.set(or.x - 0.5, 0.78, or.z - 2);
    _scene.add(deskTop);
    addCollider(or.x - 1.7, or.x + 0.7, 0, 0.88, or.z - 2.6, or.z - 1.4);

    // Desk legs
    var dLegMat = new THREE.MeshLambertMaterial({ color: 0x4A2E0A });
    [[or.x - 1.6, or.z - 2.5], [or.x + 0.6, or.z - 2.5], [or.x - 1.6, or.z - 1.5], [or.x + 0.6, or.z - 1.5]].forEach(function(p) {
      var dLeg = makeBox(0.07, 0.76, 0.07, dLegMat);
      dLeg.position.set(p[0], 0.38, p[1]);
      _scene.add(dLeg);
    });

    // Monitor
    var monCanvas = document.createElement('canvas');
    monCanvas.width = 256; monCanvas.height = 192;
    var mctx = monCanvas.getContext('2d');
    mctx.fillStyle = '#001100';
    mctx.fillRect(0, 0, 256, 192);
    mctx.fillStyle = '#00FF00';
    mctx.font = '16px monospace';
    mctx.fillText('PIZZA EMPIRE', 60, 30);
    mctx.fillText('Revenue: $4,820', 30, 60);
    mctx.fillText('Debt: $12,000', 30, 85);
    mctx.fillText('Marco - UNPAID', 30, 110);
    mctx.fillText('> _', 30, 140);
    var monTex = new THREE.CanvasTexture(monCanvas);
    var monScreen = makePlane(0.75, 0.55, new THREE.MeshBasicMaterial({ map: monTex }));
    monScreen.position.set(or.x - 0.5, 1.22, or.z - 1.95);
    monScreen.rotation.x = -0.15;
    _scene.add(monScreen);

    var monGlow = new THREE.PointLight(0x00FF44, 0.5, 3);
    monGlow.position.set(or.x - 0.5, 1.2, or.z - 1.7);
    _scene.add(monGlow);

    // Monitor stand
    var monStand = makeBox(0.08, 0.35, 0.08, new THREE.MeshLambertMaterial({ color: 0x222222 }));
    monStand.position.set(or.x - 0.5, 0.96, or.z - 2.0);
    _scene.add(monStand);

    // Office chair
    buildOfficeChair(or.x - 0.5, or.z - 1.0);

    // Safe
    var safeMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
    var safe = makeBox(0.7, 0.8, 0.6, safeMat);
    safe.position.set(or.x + 2.1, 0.4, or.z - 2.5);
    _scene.add(safe);
    addCollider(or.x + 1.75, or.x + 2.45, 0, 0.8, or.z - 2.8, or.z - 2.2);
    // Safe door knob
    var knob = makeBox(0.1, 0.1, 0.1, new THREE.MeshLambertMaterial({ color: 0x888888 }));
    knob.position.set(or.x + 2.45, 0.4, or.z - 2.5);
    _scene.add(knob);

    // Filing cabinet
    var fileMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var cabinet = makeBox(0.6, 1.3, 0.5, fileMat);
    cabinet.position.set(or.x + 2.1, 0.65, or.z - 1.0);
    _scene.add(cabinet);
    addCollider(or.x + 1.8, or.x + 2.4, 0, 1.3, or.z - 1.25, or.z - 0.75);
    // Drawer handles
    for (var d = 0; d < 3; d++) {
      var handle = makeBox(0.15, 0.04, 0.04, new THREE.MeshLambertMaterial({ color: 0x555555 }));
      handle.position.set(or.x + 2.45, 0.25 + d * 0.38, or.z - 1.0);
      _scene.add(handle);
    }

    // Office lamp
    var lampBase = makeBox(0.2, 0.04, 0.2, new THREE.MeshLambertMaterial({ color: 0x333333 }));
    lampBase.position.set(or.x + 0.6, 0.84, or.z - 2.0);
    _scene.add(lampBase);
    var lampArm = makeBox(0.04, 0.5, 0.04, new THREE.MeshLambertMaterial({ color: 0x333333 }));
    lampArm.position.set(or.x + 0.6, 1.09, or.z - 2.0);
    _scene.add(lampArm);
    var lampHead = makeBox(0.25, 0.12, 0.12, new THREE.MeshBasicMaterial({ color: 0xFFFF99 }));
    lampHead.position.set(or.x + 0.6, 1.36, or.z - 2.0);
    lampHead.rotation.z = -0.4;
    _scene.add(lampHead);
    var offLight = new THREE.PointLight(0xFFEE88, 0.8, 5);
    offLight.position.set(or.x + 0.6, 1.4, or.z - 2.0);
    _scene.add(offLight);
  }

  function buildOfficeChair(x, z) {
    var mat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var seat = makeBox(0.6, 0.08, 0.6, mat);
    seat.position.set(x, 0.52, z);
    _scene.add(seat);
    var back = makeBox(0.6, 0.65, 0.08, mat);
    back.position.set(x, 0.87, z + 0.28);
    _scene.add(back);
    var stem = makeBox(0.08, 0.5, 0.08, mat);
    stem.position.set(x, 0.25, z);
    _scene.add(stem);
    // Caster base (star shape - simplified as small boxes)
    for (var c = 0; c < 5; c++) {
      var angle = (c / 5) * Math.PI * 2;
      var caster = makeBox(0.04, 0.04, 0.35, new THREE.MeshLambertMaterial({ color: 0x222222 }));
      caster.position.set(x + Math.sin(angle) * 0.2, 0.02, z + Math.cos(angle) * 0.2);
      caster.rotation.y = angle;
      _scene.add(caster);
    }
  }

  // ── world corridor connections ───────────────────────────────────────────────
  function buildCorridor() {
    // Hallway connecting exterior to dining room (z: 0 to -13)
    var wallMat = new THREE.MeshLambertMaterial({ map: makeBrickTexture() });
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });

    var corrFloor = makePlane(4, 6, floorMat);
    corrFloor.rotation.x = -Math.PI / 2;
    corrFloor.position.set(0, 0.01, -9);
    corrFloor.receiveShadow = true;
    _scene.add(corrFloor);

    // Left wall of corridor
    var corrWL = makeBox(0.2, 4, 6, wallMat);
    corrWL.position.set(-2, 2, -9);
    _scene.add(corrWL);
    addCollider(-2.1, -1.9, 0, 4, -12, -6);

    // Right wall of corridor
    var corrWR = makeBox(0.2, 4, 6, wallMat);
    corrWR.position.set(2, 2, -9);
    _scene.add(corrWR);
    addCollider(1.9, 2.1, 0, 4, -12, -6);

    // Corridor ceiling
    var corrCeil = makePlane(4, 6, new THREE.MeshLambertMaterial({ color: 0xDDDDDD }));
    corrCeil.rotation.x = Math.PI / 2;
    corrCeil.position.set(0, 4, -9);
    _scene.add(corrCeil);

    // Kitchen-to-office passage
    var passFloor = makePlane(2, 3, floorMat);
    passFloor.rotation.x = -Math.PI / 2;
    passFloor.position.set(5, 0.01, -36);
    _scene.add(passFloor);
  }

  // ── lighting setup ───────────────────────────────────────────────────────────
  function buildLighting() {
    // Ambient
    _ambientLight = new THREE.AmbientLight(0xFFE8D6, 1.0);
    _scene.add(_ambientLight);

    // Sun / directional (no shadows — they fail on Android WebView)
    _sunLight = new THREE.DirectionalLight(0xFFFAF0, 1.2);
    _sunLight.position.set(30, 50, 20);
    _scene.add(_sunLight);

    // Fill light
    var fill = new THREE.DirectionalLight(0x8899FF, 0.2);
    fill.position.set(-20, 10, -10);
    _scene.add(fill);
  }

  // ── init ─────────────────────────────────────────────────────────────────────
  function init(canvas) {
    _clock = new THREE.Clock();

    // Scene
    _scene = new THREE.Scene();
    _scene.fog = new THREE.FogExp2(0x9BB5C8, 0.015);
    _scene.background = new THREE.Color(0x87CEEB);

    // Renderer — safe settings for Android WebView WebGL
    _renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, powerPreference: 'default', alpha: false });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    _renderer.shadowMap.enabled = false;
    // NO outputEncoding / toneMapping — they break Lambert materials on Android WebView

    buildSky();
    buildLighting();
    buildExterior();
    buildCorridor();
    buildDiningRoom();
    buildKitchen();
    buildOffice();

    // Resize handler
    window.addEventListener('resize', function () {
      var w = window.innerWidth;
      var h = window.innerHeight;
      _renderer.setSize(w, h);
      if (_linkedCamera) {
        _linkedCamera.aspect = w / h;
        _linkedCamera.updateProjectionMatrix();
      }
    });
  }

  // ── update ───────────────────────────────────────────────────────────────────
  function update(delta) {
    // Gently flicker pendant lights
    var t = _clock ? _clock.getElapsedTime() : 0;
    _pendantLights.forEach(function(pl, i) {
      pl.intensity = 0.85 + Math.sin(t * 3 + i * 1.3) * 0.08;
    });
  }

  // ── day/night cycle ──────────────────────────────────────────────────────────
  function updateTimeOfDay(hour) {
    // hour: 0-24
    var t = hour / 24;
    // Sky colour lerp: night=0x0A0A1A, dawn=0xF4A460, day=0x87CEEB, dusk=0xE07030
    var skyColor, ambColor, ambIntensity, sunIntensity;

    if (hour >= 6 && hour < 9) {
      // Dawn
      var f = (hour - 6) / 3;
      skyColor = new THREE.Color(0xF4A460).lerp(new THREE.Color(0x87CEEB), f);
      ambIntensity = 0.5 + f * 0.5;
      sunIntensity = 0.3 + f * 0.7;
      _sunLight.position.set(30 * f, 10 + 40 * f, 20);
    } else if (hour >= 9 && hour < 17) {
      // Day
      skyColor = new THREE.Color(0x87CEEB);
      ambIntensity = 1.0;
      sunIntensity = 1.0;
      var noon = (hour - 9) / 8;
      _sunLight.position.set(30 - noon * 60, 50 - noon * 20, 20);
    } else if (hour >= 17 && hour < 20) {
      // Dusk
      var f2 = (hour - 17) / 3;
      skyColor = new THREE.Color(0x87CEEB).lerp(new THREE.Color(0xE07030), f2);
      ambIntensity = 1.0 - f2 * 0.6;
      sunIntensity = 1.0 - f2 * 0.8;
      _sunLight.position.set(-30, 50 - f2 * 45, 20);
    } else {
      // Night
      skyColor = new THREE.Color(0x0A0A1A);
      ambIntensity = 0.15;
      sunIntensity = 0.0;
      _sunLight.position.set(-30, 5, 20);
    }

    if (_skyMesh) _skyMesh.material.color.copy(skyColor);
    if (_scene) _scene.background = skyColor;
    if (_ambientLight) _ambientLight.intensity = ambIntensity;
    if (_sunLight) _sunLight.intensity = sunIntensity;

    // Toggle pendant lights based on time
    var indoorLightsOn = (hour < 9 || hour > 17);
    _pendantLights.forEach(function(pl) {
      pl.visible = indoorLightsOn;
    });
  }

  // ── public API ───────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    updateTimeOfDay: updateTimeOfDay,
    setCamera: function(cam) { _linkedCamera = cam; },
    ROOM: ROOM,
    get colliders() { return _colliders; },
    get scene() { return _scene; },
    get renderer() { return _renderer; },
    get clock() { return _clock; }
  };
}());
