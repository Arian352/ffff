/* npcs.js - Pizza Empire NPC System
 * Uses Three.js globals (THREE available globally)
 * IIFE pattern - no ES modules
 */
var NPCs = (function () {
  'use strict';

  // ── internal state ──────────────────────────────────────────────────────────
  var _scene = null;
  var _gameState = null;
  var _ROOM = null;
  var _npcs = [];
  var _customers = [];
  var _nearestNPC = null;

  // ── character definitions ────────────────────────────────────────────────────
  var CHARACTER_DEFS = {
    nonna: {
      name: 'Nonna',
      torsoColor:   0x2E7D32, // green apron
      pantsColor:   0x4A4A4A,
      skinColor:    0xF5C5A3,
      hairColor:    0xCCCCCC, // gray
      shoeColor:    0x333333,
      eyeColor:     0x4A3020,
      interactRadius: 2.5,
      storyChapter: 1,
      idlePosition: null  // set in buildNPC
    },
    marco: {
      name: 'Marco',
      torsoColor:   0x1A1A2E, // dark suit
      pantsColor:   0x16213E,
      skinColor:    0xD4A574,
      hairColor:    0x111111, // black
      shoeColor:    0x1A0A00,
      eyeColor:     0x2C1810,
      interactRadius: 2.5,
      storyChapter: 3,
      idlePosition: null
    },
    bauer: {
      name: 'Officer Bauer',
      torsoColor:   0x1A3A6B, // blue uniform
      pantsColor:   0x1A2E5A,
      skinColor:    0xF0D0B0,
      hairColor:    0x6B4226, // brown
      shoeColor:    0x111111,
      eyeColor:     0x2A4A2A,
      interactRadius: 2.5,
      storyChapter: 6,
      idlePosition: null
    },
    rosa: {
      name: 'Rosa',
      torsoColor:   0xCC2244, // red top
      pantsColor:   0x2A2A2A,
      skinColor:    0xF5C5A3,
      hairColor:    0xAA1111, // red hair
      shoeColor:    0x1A0A00,
      eyeColor:     0x4A1010,
      interactRadius: 2.5,
      storyChapter: 2,
      idlePosition: null
    }
  };

  // ── name tag canvas ──────────────────────────────────────────────────────────
  function makeNameTagTexture(name) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    var ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(10,5,0,0.82)';
    _roundRect(ctx, 4, 4, 248, 56, 10);
    ctx.fill();
    ctx.strokeStyle = '#C8A040';
    ctx.lineWidth = 2;
    _roundRect(ctx, 4, 4, 248, 56, 10);
    ctx.stroke();
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 32);
    return new THREE.CanvasTexture(c);
  }

  function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ── build humanoid mesh ──────────────────────────────────────────────────────
  function buildHumanoid(def, x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var skinMat  = new THREE.MeshLambertMaterial({ color: def.skinColor });
    var torsoMat = new THREE.MeshLambertMaterial({ color: def.torsoColor });
    var pantsMat = new THREE.MeshLambertMaterial({ color: def.pantsColor });
    var hairMat  = new THREE.MeshLambertMaterial({ color: def.hairColor });
    var shoeMat  = new THREE.MeshLambertMaterial({ color: def.shoeColor });

    // ── HEAD ─────────────────────────────────────────────────────────────────
    var headGroup = new THREE.Group();
    headGroup.position.set(0, 1.55, 0);
    group.add(headGroup);

    var headGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    var head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Eyes
    var eyeMat = new THREE.MeshBasicMaterial({ color: def.eyeColor });
    var eyeGeo = new THREE.BoxGeometry(0.06, 0.05, 0.02);
    var leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 0.04, 0.2);
    headGroup.add(leftEye);
    var rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 0.04, 0.2);
    headGroup.add(rightEye);

    // Hair block on top
    var hairGeo = new THREE.BoxGeometry(0.40, 0.14, 0.40);
    var hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.24, -0.01);
    hair.castShadow = true;
    headGroup.add(hair);

    // Nose
    var noseMat = new THREE.MeshLambertMaterial({ color: def.skinColor });
    var noseGeo = new THREE.BoxGeometry(0.05, 0.05, 0.07);
    var nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -0.03, 0.21);
    headGroup.add(nose);

    // ── TORSO ────────────────────────────────────────────────────────────────
    var torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.0, 0);
    group.add(torsoGroup);

    var torsoGeo = new THREE.BoxGeometry(0.42, 0.55, 0.22);
    var torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.castShadow = true;
    torsoGroup.add(torso);

    // ── NECK ─────────────────────────────────────────────────────────────────
    var neckGeo = new THREE.BoxGeometry(0.14, 0.12, 0.14);
    var neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 0.335, 0);
    torsoGroup.add(neck);

    // ── ARMS ─────────────────────────────────────────────────────────────────
    var leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.28, 0.22, 0);
    torsoGroup.add(leftArmGroup);
    var leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.14), torsoMat);
    leftUpperArm.castShadow = true;
    leftArmGroup.add(leftUpperArm);
    var leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.12), skinMat);
    leftForearm.position.set(0, -0.28, 0);
    leftForearm.castShadow = true;
    leftArmGroup.add(leftForearm);
    // Left hand
    var leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.08), skinMat);
    leftHand.position.set(0, -0.44, 0);
    leftArmGroup.add(leftHand);

    var rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.28, 0.22, 0);
    torsoGroup.add(rightArmGroup);
    var rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.14), torsoMat);
    rightUpperArm.castShadow = true;
    rightArmGroup.add(rightUpperArm);
    var rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.12), skinMat);
    rightForearm.position.set(0, -0.28, 0);
    rightForearm.castShadow = true;
    rightArmGroup.add(rightForearm);
    var rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.08), skinMat);
    rightHand.position.set(0, -0.44, 0);
    rightArmGroup.add(rightHand);

    // ── WAIST / BELT ─────────────────────────────────────────────────────────
    var beltGeo = new THREE.BoxGeometry(0.44, 0.07, 0.24);
    var beltMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.0, 0);
    torsoGroup.add(belt);

    // ── LEGS ─────────────────────────────────────────────────────────────────
    var leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.11, 0.42, 0);
    group.add(leftLegGroup);
    var leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.18), pantsMat);
    leftThigh.castShadow = true;
    leftLegGroup.add(leftThigh);
    var leftShin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.30, 0.16), pantsMat);
    leftShin.position.set(0, -0.32, 0);
    leftShin.castShadow = true;
    leftLegGroup.add(leftShin);
    // Left foot
    var leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.09, 0.26), shoeMat);
    leftFoot.position.set(0, -0.49, 0.04);
    leftLegGroup.add(leftFoot);

    var rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.11, 0.42, 0);
    group.add(rightLegGroup);
    var rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.18), pantsMat);
    rightThigh.castShadow = true;
    rightLegGroup.add(rightThigh);
    var rightShin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.30, 0.16), pantsMat);
    rightShin.position.set(0, -0.32, 0);
    rightShin.castShadow = true;
    rightLegGroup.add(rightShin);
    var rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.09, 0.26), shoeMat);
    rightFoot.position.set(0, -0.49, 0.04);
    rightLegGroup.add(rightFoot);

    // ── NAME TAG ─────────────────────────────────────────────────────────────
    var tagTex = makeNameTagTexture(def.name);
    var tagMat = new THREE.MeshBasicMaterial({ map: tagTex, transparent: true, depthWrite: false });
    var tagGeo = new THREE.PlaneGeometry(1.0, 0.25);
    var nameTag = new THREE.Mesh(tagGeo, tagMat);
    nameTag.position.set(0, 2.05, 0);
    group.add(nameTag);

    // Special features per character
    if (def === CHARACTER_DEFS.nonna) {
      // Apron overlay
      var apronMat = new THREE.MeshLambertMaterial({ color: 0x2E7D32 });
      var apron = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.14), apronMat);
      apron.position.set(0, 0.0, 0.06);
      torsoGroup.add(apron);
      // Apron strings
      var strMat = new THREE.MeshLambertMaterial({ color: 0x1B5E20 });
      var strL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), strMat);
      strL.position.set(-0.18, 0.15, 0.06);
      torsoGroup.add(strL);
      var strR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), strMat);
      strR.position.set(0.18, 0.15, 0.06);
      torsoGroup.add(strR);
    } else if (def === CHARACTER_DEFS.marco) {
      // Tie
      var tieMat = new THREE.MeshLambertMaterial({ color: 0xAA0000 });
      var tie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.05), tieMat);
      tie.position.set(0, 0.08, 0.12);
      torsoGroup.add(tie);
      // Scar hint (slightly different skin patch on cheek)
      var scarMat = new THREE.MeshBasicMaterial({ color: 0xC09070 });
      var scar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.02), scarMat);
      scar.position.set(-0.15, -0.02, 0.2);
      headGroup.add(scar);
    } else if (def === CHARACTER_DEFS.bauer) {
      // Badge
      var badgeMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
      var badge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.03), badgeMat);
      badge.position.set(-0.16, 0.18, 0.12);
      torsoGroup.add(badge);
      // Moustache
      var mustMat = new THREE.MeshLambertMaterial({ color: 0x5C3317 });
      var moustache = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), mustMat);
      moustache.position.set(0, -0.07, 0.2);
      headGroup.add(moustache);
    } else if (def === CHARACTER_DEFS.rosa) {
      // Earrings
      var earMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
      var earL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.04), earMat);
      earL.position.set(-0.21, -0.08, 0.0);
      headGroup.add(earL);
      var earR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.04), earMat);
      earR.position.set(0.21, -0.08, 0.0);
      headGroup.add(earR);
    }

    return {
      group: group,
      headGroup: headGroup,
      torsoGroup: torsoGroup,
      leftArmGroup: leftArmGroup,
      rightArmGroup: rightArmGroup,
      leftLegGroup: leftLegGroup,
      rightLegGroup: rightLegGroup,
      nameTag: nameTag,
      def: def,
      bobPhase: Math.random() * Math.PI * 2,
      animTimer: Math.random() * 10,
      idleX: x,
      idleZ: z,
      facingAngle: 0,
      interactRadius: def.interactRadius,
      storyChapter: def.storyChapter,
      isInteractable: true
    };
  }

  // ── build a random customer ───────────────────────────────────────────────────
  function buildCustomer(x, y, z, seatAngle) {
    var skinColors  = [0xF5C5A3, 0xD4A574, 0xA0724A, 0xC8956A, 0x8B6040];
    var torsoColors = [0x3344AA, 0x44AA33, 0xAA4433, 0x888888, 0x6633AA, 0xCC8800];
    var pantsColors = [0x222244, 0x224422, 0x442222, 0x444444, 0x113322];
    var hairColors  = [0x111111, 0x4A2E0A, 0xCC9900, 0x882211, 0x999999];

    var si = Math.floor(Math.random() * skinColors.length);
    var ti = Math.floor(Math.random() * torsoColors.length);
    var pi = Math.floor(Math.random() * pantsColors.length);
    var hi = Math.floor(Math.random() * hairColors.length);

    var def = {
      name: '',
      torsoColor:  torsoColors[ti],
      pantsColor:  pantsColors[pi],
      skinColor:   skinColors[si],
      hairColor:   hairColors[hi],
      shoeColor:   0x222222,
      eyeColor:    0x222222,
      interactRadius: 0,
      storyChapter: 0
    };

    var g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = seatAngle;

    var skinMat  = new THREE.MeshLambertMaterial({ color: def.skinColor });
    var torsoMat = new THREE.MeshLambertMaterial({ color: def.torsoColor });
    var pantsMat = new THREE.MeshLambertMaterial({ color: def.pantsColor });
    var hairMat  = new THREE.MeshLambertMaterial({ color: def.hairColor });
    var shoeMat  = new THREE.MeshLambertMaterial({ color: def.shoeColor });

    // Head
    var hd = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), skinMat);
    hd.position.set(0, 1.35, 0);
    hd.castShadow = true;
    g.add(hd);
    // Hair
    var hr = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.38), hairMat);
    hr.position.set(0, 1.56, -0.01);
    g.add(hr);
    // Eyes
    var eyeMat = new THREE.MeshBasicMaterial({ color: def.eyeColor });
    var eL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), eyeMat);
    eL.position.set(-0.09, 1.38, 0.19);
    g.add(eL);
    var eR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), eyeMat);
    eR.position.set(0.09, 1.38, 0.19);
    g.add(eR);
    // Torso (seated, slightly forward lean)
    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.20), torsoMat);
    torso.position.set(0, 0.85, 0);
    torso.rotation.x = 0.18;
    torso.castShadow = true;
    g.add(torso);
    // Legs (bent for seated)
    var lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.16), pantsMat);
    lLeg.position.set(-0.1, 0.46, 0.15);
    lLeg.rotation.x = -Math.PI / 2.2;
    lLeg.castShadow = true;
    g.add(lLeg);
    var rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.16), pantsMat);
    rLeg.position.set(0.1, 0.46, 0.15);
    rLeg.rotation.x = -Math.PI / 2.2;
    rLeg.castShadow = true;
    g.add(rLeg);
    // Feet
    var lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.24), shoeMat);
    lFoot.position.set(-0.1, 0.14, 0.38);
    g.add(lFoot);
    var rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.24), shoeMat);
    rFoot.position.set(0.1, 0.14, 0.38);
    g.add(rFoot);
    // Arms resting on table
    var lArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.42), torsoMat);
    lArm.position.set(-0.22, 0.85, 0.28);
    lArm.rotation.x = 0.4;
    g.add(lArm);
    var rArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.42), torsoMat);
    rArm.position.set(0.22, 0.85, 0.28);
    rArm.rotation.x = 0.4;
    g.add(rArm);

    return {
      group: g,
      isInteractable: false,
      animTimer: Math.random() * 10,
      bobPhase: Math.random() * Math.PI * 2
    };
  }

  // ── spawn logic ───────────────────────────────────────────────────────────────
  function spawnNPCs() {
    var day = (_gameState && _gameState.day) ? _gameState.day : 1;
    var gangEvent   = (_gameState && _gameState.gangEvent)   ? _gameState.gangEvent   : null;
    var policeEvent = (_gameState && _gameState.policeEvent) ? _gameState.policeEvent : null;

    // Nonna — always present, in kitchen
    var nonnaDef = CHARACTER_DEFS.nonna;
    nonnaDef.idlePosition = { x: _ROOM.kitchen.x - 1.5, z: _ROOM.kitchen.z + 1.0 };
    var nonnaObj = buildHumanoid(nonnaDef, nonnaDef.idlePosition.x, 0, nonnaDef.idlePosition.z);
    _scene.add(nonnaObj.group);
    _npcs.push(nonnaObj);

    // Rosa — from day 2, in dining room
    if (day >= 2) {
      var rosaDef = CHARACTER_DEFS.rosa;
      rosaDef.idlePosition = { x: _ROOM.dining.x + 2, z: _ROOM.dining.z + 2 };
      var rosaObj = buildHumanoid(rosaDef, rosaDef.idlePosition.x, 0, rosaDef.idlePosition.z);
      _scene.add(rosaObj.group);
      _npcs.push(rosaObj);
    }

    // Marco — from day 3, only if no gangEvent; loiters near office
    if (day >= 3 && gangEvent === null) {
      var marcoDef = CHARACTER_DEFS.marco;
      marcoDef.idlePosition = { x: _ROOM.office.x - 1.0, z: _ROOM.office.z + 1.5 };
      var marcoObj = buildHumanoid(marcoDef, marcoDef.idlePosition.x, 0, marcoDef.idlePosition.z);
      _scene.add(marcoObj.group);
      _npcs.push(marcoObj);
    }

    // Bauer — from day 6, only if no policeEvent; stands near dining entrance
    if (day >= 6 && policeEvent === null) {
      var bauerDef = CHARACTER_DEFS.bauer;
      bauerDef.idlePosition = { x: _ROOM.dining.x - 2, z: _ROOM.dining.z + 4 };
      var bauerObj = buildHumanoid(bauerDef, bauerDef.idlePosition.x, 0, bauerDef.idlePosition.z);
      _scene.add(bauerObj.group);
      _npcs.push(bauerObj);
    }

    // Random customers — 3-5 seated at dining tables
    var numCustomers = 3 + Math.floor(Math.random() * 3);
    var tableSeats = [
      // [tableX, tableZ, seatDx, seatDz, angle]
      { x: _ROOM.dining.x - 3, z: _ROOM.dining.z - 3,  dx: 0,    dz: -1.0, angle: 0 },
      { x: _ROOM.dining.x + 3, z: _ROOM.dining.z - 3,  dx: 0,    dz:  1.0, angle: Math.PI },
      { x: _ROOM.dining.x - 3, z: _ROOM.dining.z,       dx: -1.1, dz:  0,   angle: Math.PI / 2 },
      { x: _ROOM.dining.x + 3, z: _ROOM.dining.z,       dx:  1.1, dz:  0,   angle: -Math.PI / 2 },
      { x: _ROOM.dining.x - 3, z: _ROOM.dining.z + 3.5, dx: 0,    dz: -1.0, angle: 0 },
      { x: _ROOM.dining.x + 3, z: _ROOM.dining.z + 3.5, dx:  1.1, dz:  0,   angle: -Math.PI / 2 }
    ];

    for (var i = 0; i < numCustomers && i < tableSeats.length; i++) {
      var seat = tableSeats[i];
      var cx = seat.x + seat.dx;
      var cz = seat.z + seat.dz;
      var cust = buildCustomer(cx, 0, cz, seat.angle + Math.PI);
      _scene.add(cust.group);
      _customers.push(cust);
    }
  }

  // ── init ──────────────────────────────────────────────────────────────────────
  function init(scene, gameState, ROOM) {
    _scene     = scene;
    _gameState = gameState;
    _ROOM      = ROOM;
    _npcs      = [];
    _customers = [];
    _nearestNPC = null;

    spawnNPCs();
  }

  // ── clearAll ──────────────────────────────────────────────────────────────────
  function clearAll() {
    _npcs.forEach(function(npc) {
      if (_scene && npc.group) _scene.remove(npc.group);
    });
    _customers.forEach(function(c) {
      if (_scene && c.group) _scene.remove(c.group);
    });
    _npcs      = [];
    _customers = [];
    _nearestNPC = null;
  }

  // ── update ────────────────────────────────────────────────────────────────────
  function update(delta, playerPos, camera) {
    if (!playerPos) return null;

    var t = performance.now() * 0.001;
    _nearestNPC = null;
    var nearestDist = Infinity;

    // ── update main NPCs ─────────────────────────────────────────────────────
    _npcs.forEach(function(npc) {
      npc.animTimer += delta;

      var dx = playerPos.x - npc.group.position.x;
      var dz = playerPos.z - npc.group.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      // ── Body bob (idle) ──────────────────────────────────────────────────
      var bobY = Math.sin(t * 1.6 + npc.bobPhase) * 0.025;
      npc.group.position.y = bobY;

      // ── Arm swing (idle) ─────────────────────────────────────────────────
      if (npc.leftArmGroup && npc.rightArmGroup) {
        var swing = Math.sin(t * 1.6 + npc.bobPhase) * 0.18;
        npc.leftArmGroup.rotation.x  =  swing;
        npc.rightArmGroup.rotation.x = -swing;
      }

      // ── Leg gentle shift ─────────────────────────────────────────────────
      if (npc.leftLegGroup && npc.rightLegGroup) {
        var legSwing = Math.sin(t * 1.6 + npc.bobPhase) * 0.06;
        npc.leftLegGroup.rotation.x  =  legSwing;
        npc.rightLegGroup.rotation.x = -legSwing;
      }

      // ── Face player when within 5 units ─────────────────────────────────
      if (dist < 5) {
        var targetAngle = Math.atan2(dx, dz);
        var currentAngle = npc.group.rotation.y;
        // Smooth rotation
        var angleDiff = targetAngle - currentAngle;
        // Wrap to [-PI, PI]
        while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        npc.group.rotation.y += angleDiff * Math.min(delta * 3.5, 1.0);
      }

      // ── Billboard name tag ───────────────────────────────────────────────
      if (npc.nameTag && camera) {
        // Make name tag face camera
        npc.nameTag.lookAt(camera.position);
      }

      // ── Find nearest interactable ────────────────────────────────────────
      if (npc.isInteractable && dist < npc.interactRadius) {
        if (dist < nearestDist) {
          nearestDist = dist;
          _nearestNPC = npc;
        }
      }
    });

    // ── update customers (subtle idle only) ──────────────────────────────────
    _customers.forEach(function(cust) {
      cust.animTimer += delta;
      // Very subtle head bob
      var bobY = Math.sin(t * 1.1 + cust.bobPhase) * 0.012;
      if (cust.group) {
        cust.group.children[0].position.y = 1.35 + bobY; // head
      }
    });

    return _nearestNPC;
  }

  // ── respawn (e.g., on new day) ────────────────────────────────────────────────
  function respawn(gameState) {
    _gameState = gameState;
    clearAll();
    spawnNPCs();
  }

  // ── public API ────────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    clearAll: clearAll,
    respawn: respawn,
    get npcs() { return _npcs; },
    get nearestNPC() { return _nearestNPC; }
  };
}());
