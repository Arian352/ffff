// city.js - Open city environment for Pizza Empire
// Extends the world north of the restaurant (positive Z)
var City = (function () {
    'use strict';

    // ── Internal state ────────────────────────────────────────────────────────
    var scene = null;
    var colliderList = null;
    var playerInside = false;
    var currentBuilding = null;
    var playerPreTeleportPos = null;
    var doorTriggers = [];
    var exitTriggers = [];
    var interiorGroups = {};

    // ── Named city locations ──────────────────────────────────────────────────
    var LOCATIONS = {
        frischmarkt:     { x: -12, y: 0, z:  8,  label: 'Frischmarkt' },
        baumarkt:        { x:  16, y: 0, z:  8,  label: 'Baumarkt' },
        park:            { x:   0, y: 0, z:  8,  label: 'Park' },
        la_famiglia:     { x: -15, y: 0, z: 15,  label: 'La Famiglia' },
        apartments:      { x:  18, y: 0, z: 25,  label: 'Apartments' },
        police_station:  { x: -18, y: 0, z: 30,  label: 'Police Station' },
        restaurant:      { x:   0, y: 0, z: -20, label: 'Restaurant' },
        street_north:    { x:   0, y: 0, z:  5,  label: 'Street North' },
    };

    // Interior room X-offsets (far off screen so player can't see them normally)
    var INTERIOR_OFFSETS = {
        frischmarkt:    200,
        baumarkt:       220,
        la_famiglia:    240,
        police_station: 260,
        apartments:     280,
    };

    // ── Shop inventories ──────────────────────────────────────────────────────
    var SHOP_INVENTORIES = {
        frischmarkt: [
            { id: 'sauce',     name: 'Tomatensauce',  qty: 5, price: 6  },
            { id: 'cheese',    name: 'Käse',          qty: 5, price: 8  },
            { id: 'dough',     name: 'Teig',          qty: 8, price: 5  },
            { id: 'salami',    name: 'Salami',        qty: 5, price: 7  },
            { id: 'mushrooms', name: 'Pilze',         qty: 5, price: 5  },
            { id: 'peppers',   name: 'Paprika',       qty: 5, price: 4  },
            { id: 'olives',    name: 'Oliven',        qty: 4, price: 4  },
            { id: 'basil',     name: 'Basilikum',     qty: 6, price: 3  },
            { id: 'pineapple', name: 'Ananas',        qty: 4, price: 4  },
        ],
        baumarkt: [
            { id: 'upgrade_oven',    name: 'Ofen Upgrade',   qty: 1, price: 280 },
            { id: 'upgrade_decor',   name: 'Dekor Upgrade',  qty: 1, price: 180 },
            { id: 'upgrade_signage', name: 'Schild Upgrade', qty: 1, price: 140 },
        ],
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    function makeMat(color, emissive) {
        return new THREE.MeshLambertMaterial({
            color: color,
            emissive: emissive !== undefined ? emissive : 0x000000
        });
    }

    function makeBox(w, h, d, mat, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    function addColliderBox(ox, oy, oz, w, h, d) {
        // Push an axis-aligned bounding box object into the collider list
        colliderList.push({
            type: 'box',
            minX: ox - w / 2, maxX: ox + w / 2,
            minY: oy,         maxY: oy + h,
            minZ: oz - d / 2, maxZ: oz + d / 2,
        });
    }

    // Canvas texture helper for glowing signs
    function makeSignTexture(text, bgColor, textColor, fontSize) {
        fontSize = fontSize || 28;
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = bgColor || '#1a1a2e';
        ctx.fillRect(0, 0, 512, 128);
        // Glow
        ctx.shadowColor = textColor || '#ffffff';
        ctx.shadowBlur = 18;
        ctx.fillStyle = textColor || '#ffffff';
        ctx.font = 'bold ' + fontSize + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 64);
        var tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    function makeSign(text, bgColor, textColor, w, h, px, py, pz, ry) {
        var tex = makeSignTexture(text, bgColor, textColor);
        var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
        var geo = new THREE.PlaneGeometry(w, h);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(px, py, pz);
        if (ry !== undefined) mesh.rotation.y = ry;
        return mesh;
    }

    // ── Road / sidewalk ───────────────────────────────────────────────────────
    function buildStreet() {
        var streetMat  = makeMat(0x2a2a2a);
        var sidewalkMat = makeMat(0x888870);
        var lineMat    = makeMat(0xffee00);

        // Main road (runs north-south, Z 0 to Z +35)
        var road = makeBox(12, 0.05, 50, streetMat, 0, 0.01, 17);
        scene.add(road);

        // Centre line dashes
        for (var dz = 2; dz <= 34; dz += 4) {
            var dash = makeBox(0.3, 0.06, 2, lineMat, 0, 0.02, dz);
            scene.add(dash);
        }

        // Sidewalks
        var swL = makeBox(6, 0.15, 50, sidewalkMat, -9, 0.05, 17);
        var swR = makeBox(6, 0.15, 50, sidewalkMat,  9, 0.05, 17);
        scene.add(swL);
        scene.add(swR);

        // East-west cross street at Z=+15
        var crossRoad = makeBox(60, 0.05, 10, streetMat, 0, 0.01, 15);
        scene.add(crossRoad);

        // Street lamps
        var lampMat    = makeMat(0x444444);
        var lampLightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        var lampPositions = [
            { x: -7, z: 5 }, { x: 7, z: 5 },
            { x: -7, z: 20 }, { x: 7, z: 20 },
            { x: -7, z: 32 }, { x: 7, z: 32 },
        ];
        lampPositions.forEach(function (lp) {
            var pole = makeBox(0.2, 6, 0.2, lampMat, lp.x, 3, lp.z);
            var arm  = makeBox(2, 0.15, 0.15, lampMat, lp.x + (lp.x < 0 ? 1 : -1), 6.1, lp.z);
            var bulb = makeBox(0.5, 0.5, 0.5, lampLightMat, lp.x + (lp.x < 0 ? 2 : -2), 6, lp.z);
            scene.add(pole); scene.add(arm); scene.add(bulb);
        });
    }

    // ── Generic building shell ────────────────────────────────────────────────
    function buildExteriorShell(group, w, h, d, wallColor, roofColor) {
        var wallMat = makeMat(wallColor);
        var roofMat = makeMat(roofColor);
        // Body
        var body = makeBox(w, h, d, wallMat, 0, h / 2, 0);
        group.add(body);
        // Roof lip
        var roof = makeBox(w + 0.4, 0.3, d + 0.4, roofMat, 0, h + 0.15, 0);
        group.add(roof);
    }

    function buildWindows(group, buildingW, buildingH, buildingD, rows, cols) {
        var winMat = new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.8 });
        var gapX = buildingW / (cols + 1);
        var gapY = buildingH / (rows + 1);
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var wx = -buildingW / 2 + gapX * (c + 1);
                var wy = gapY * (r + 1);
                // Front face
                var wf = makeBox(1.2, 1.0, 0.05, winMat, wx, wy, buildingD / 2 + 0.03);
                group.add(wf);
            }
        }
    }

    function buildDoorFrame(group, dz, doorColor) {
        var frameMat = makeMat(doorColor || 0x5c3d1e);
        // Door frame: two side posts + top bar
        var leftPost  = makeBox(0.2, 3.0, 0.15, frameMat, -0.8, 1.5, dz);
        var rightPost = makeBox(0.2, 3.0, 0.15, frameMat,  0.8, 1.5, dz);
        var topBar    = makeBox(2.0, 0.2, 0.15, frameMat,  0.0, 3.0, dz);
        var door      = makeBox(1.4, 2.8, 0.08, new THREE.MeshLambertMaterial({ color: 0x7a5230 }), 0, 1.4, dz + 0.05);
        group.add(leftPost); group.add(rightPost); group.add(topBar); group.add(door);
    }

    // ── Register door trigger ─────────────────────────────────────────────────
    function registerDoor(worldX, worldZ, buildingId) {
        doorTriggers.push({ x: worldX, z: worldZ, id: buildingId, radius: 2.0 });
    }

    function registerExit(interiorX, interiorZ, buildingId) {
        exitTriggers.push({ x: interiorX, z: interiorZ, id: buildingId, radius: 2.0 });
    }

    // ── EXTERIORS ─────────────────────────────────────────────────────────────

    // ── Frischmarkt (grocery) x=-12 z=+8 ─────────────────────────────────────
    function buildFrischmarkt() {
        var group = new THREE.Group();
        group.position.set(-12, 0, 8);
        buildExteriorShell(group, 10, 5, 8, 0x6fbd6f, 0x2d7a2d);
        buildWindows(group, 10, 5, 8, 1, 3);
        buildDoorFrame(group, 4.05, 0x2d7a2d);
        group.add(makeSign('🛒 Frischmarkt', '#1a4d1a', '#88ff88', 512 / 16, 128 / 16, 0, 5.5, 4.1, 0));
        scene.add(group);
        // Colliders for exterior walls
        addColliderBox(-12, 0, 8, 10, 5, 8);
        registerDoor(-12, 8 + 4.1, 'frischmarkt');
    }

    // ── Baumarkt (hardware) x=+16 z=+8 ───────────────────────────────────────
    function buildBaumarkt() {
        var group = new THREE.Group();
        group.position.set(16, 0, 8);
        buildExteriorShell(group, 11, 5.5, 9, 0xd4a847, 0x8b6914);
        buildWindows(group, 11, 5.5, 9, 1, 4);
        buildDoorFrame(group, 4.55, 0x8b6914);
        group.add(makeSign('🔨 Baumarkt', '#3d2b00', '#ffdd55', 512 / 16, 128 / 16, 0, 6.0, 4.6, 0));
        scene.add(group);
        addColliderBox(16, 0, 8, 11, 5.5, 9);
        registerDoor(16, 8 + 4.6, 'baumarkt');
    }

    // ── La Famiglia bar x=-15 z=+15 ───────────────────────────────────────────
    function buildLaFamiglia() {
        var group = new THREE.Group();
        group.position.set(-15, 0, 15);
        buildExteriorShell(group, 9, 5, 8, 0x3d1a1a, 0x1a0000);
        buildWindows(group, 9, 5, 8, 1, 2);
        buildDoorFrame(group, 4.05, 0x8b0000);
        group.add(makeSign('🍷 La Famiglia', '#1a0000', '#ff4444', 512 / 16, 128 / 16, 0, 5.5, 4.1, 0));
        // Red neon glow strip
        var neonMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        var neon = makeBox(9, 0.1, 0.1, neonMat, 0, 5.3, 4.1);
        group.add(neon);
        scene.add(group);
        addColliderBox(-15, 0, 15, 9, 5, 8);
        registerDoor(-15, 15 + 4.1, 'la_famiglia');
    }

    // ── Police Station x=-18 z=+30 ────────────────────────────────────────────
    function buildPoliceStation() {
        var group = new THREE.Group();
        group.position.set(-18, 0, 30);
        buildExteriorShell(group, 12, 7, 10, 0xc8c8b0, 0x4a4a3a);
        buildWindows(group, 12, 7, 10, 2, 4);
        buildDoorFrame(group, 5.05, 0x333333);
        // Police stripe
        var stripeMat = makeMat(0x003399);
        var stripe = makeBox(12.1, 0.6, 0.05, stripeMat, 0, 1.8, 5.1);
        group.add(stripe);
        group.add(makeSign('🚔 Polizeipräsidium', '#002266', '#4488ff', 512 / 18, 128 / 18, 0, 7.5, 5.1, 0));
        scene.add(group);
        addColliderBox(-18, 0, 30, 12, 7, 10);
        registerDoor(-18, 30 + 5.1, 'police_station');
    }

    // ── Apartments x=+18 z=+25 ────────────────────────────────────────────────
    function buildApartments() {
        var group = new THREE.Group();
        group.position.set(18, 0, 25);
        buildExteriorShell(group, 10, 10, 9, 0xb09070, 0x6a5040);
        buildWindows(group, 10, 10, 9, 3, 3);
        buildDoorFrame(group, 4.55, 0x4a3020);
        group.add(makeSign('🏠 Apartmenthaus', '#3d2800', '#ffcc88', 512 / 16, 128 / 16, 0, 10.5, 4.6, 0));
        scene.add(group);
        addColliderBox(18, 0, 25, 10, 10, 9);
        registerDoor(18, 25 + 4.6, 'apartments');
    }

    // ── Park x=0 z=+8 ────────────────────────────────────────────────────────
    function buildPark() {
        // Grass patch
        var grassMat = makeMat(0x44aa44);
        var grass = makeBox(14, 0.1, 12, grassMat, 0, 0.05, 8);
        scene.add(grass);

        // Bench
        var benchMat = makeMat(0x7a5c2e);
        var seatGeo  = new THREE.BoxGeometry(2.5, 0.15, 0.7);
        var seat = new THREE.Mesh(seatGeo, benchMat);
        seat.position.set(0, 0.5, 9);
        var backGeo = new THREE.BoxGeometry(2.5, 0.8, 0.12);
        var back = new THREE.Mesh(backGeo, benchMat);
        back.position.set(0, 0.95, 9.3);
        var legMat = makeMat(0x5a3c1a);
        var legL = makeBox(0.15, 0.5, 0.5, legMat, -1.0, 0.25, 9);
        var legR = makeBox(0.15, 0.5, 0.5, legMat,  1.0, 0.25, 9);
        scene.add(seat); scene.add(back); scene.add(legL); scene.add(legR);

        // Tree trunk
        var trunkMat = makeMat(0x5c3d11);
        var leafMat  = makeMat(0x228822);
        var trunk = makeBox(0.5, 3, 0.5, trunkMat, -3, 1.5, 7);
        var leaves = makeBox(2.5, 2.5, 2.5, leafMat, -3, 4.3, 7);
        var trunk2 = makeBox(0.5, 3, 0.5, trunkMat, 3, 1.5, 10);
        var leaves2 = makeBox(2.2, 2.2, 2.2, leafMat, 3, 4.2, 10);
        scene.add(trunk); scene.add(leaves); scene.add(trunk2); scene.add(leaves2);

        // Park fence
        var fenceMat = makeMat(0x888866);
        for (var fz = 2; fz <= 14; fz += 2) {
            scene.add(makeBox(0.15, 1, 0.15, fenceMat, -7, 0.5, fz));
            scene.add(makeBox(0.15, 1, 0.15, fenceMat,  7, 0.5, fz));
        }
        scene.add(makeBox(14.3, 0.12, 0.12, fenceMat, 0, 0.8, 2));
        scene.add(makeBox(14.3, 0.12, 0.12, fenceMat, 0, 0.8, 14));
    }

    // ── INTERIORS ─────────────────────────────────────────────────────────────
    // All interiors are placed at (INTERIOR_OFFSETS[id], 0, 0) so they are
    // invisible until the player is teleported there.

    function buildInteriorFloorWalls(group, w, d, h, floorColor, wallColor) {
        var floorMat = makeMat(floorColor);
        var wallMat  = makeMat(wallColor);
        // Floor
        group.add(makeBox(w, 0.1, d, floorMat, 0, 0.05, 0));
        // Ceiling
        group.add(makeBox(w, 0.15, d, makeMat(0xddddcc), 0, h, 0));
        // Four walls
        group.add(makeBox(w, h, 0.25, wallMat, 0, h / 2,  d / 2));   // North
        group.add(makeBox(w, h, 0.25, wallMat, 0, h / 2, -d / 2));   // South
        group.add(makeBox(0.25, h, d, wallMat,  w / 2, h / 2, 0));   // East
        group.add(makeBox(0.25, h, d, wallMat, -w / 2, h / 2, 0));   // West
        // Opening in south wall (door gap)
        // We mark it by tinting that wall segment
    }

    // ─ Frischmarkt interior ──────────────────────────────────────────────────
    function buildFrischmarktInterior() {
        var ox = INTERIOR_OFFSETS.frischmarkt;
        var group = new THREE.Group();
        group.position.set(ox, 0, 0);

        buildInteriorFloorWalls(group, 16, 14, 4, 0xf0ece0, 0xd4cfc4);

        // Shelving units (3 rows)
        var shelfMat = makeMat(0xc89050);
        var rows = [
            { x: -4, z: -3 }, { x: 0, z: -3 }, { x: 4, z: -3 },
        ];
        rows.forEach(function (r) {
            // Shelf frame
            group.add(makeBox(2.5, 2.5, 0.3, shelfMat, r.x, 1.25, r.z));
            // Three shelf boards
            for (var s = 0; s < 3; s++) {
                group.add(makeBox(2.4, 0.07, 0.25, makeMat(0xddb878), r.x, 0.5 + s * 0.9, r.z));
            }
            // Products (coloured boxes)
            var cols = [0xff4444, 0xffcc00, 0x44cc44, 0xff8800, 0x8844ff];
            for (var p = 0; p < 5; p++) {
                group.add(makeBox(0.3, 0.3, 0.2, new THREE.MeshLambertMaterial({ color: cols[p % cols.length] }),
                    r.x - 0.8 + p * 0.4, 0.65, r.z));
            }
        });

        // Checkout counter
        var counterMat = makeMat(0x778866);
        group.add(makeBox(4, 1.1, 1, counterMat, 0, 0.55, 5));
        group.add(makeBox(4.2, 0.08, 1.1, makeMat(0x556644), 0, 1.1, 5));
        // Cash register
        group.add(makeBox(0.5, 0.4, 0.3, makeMat(0x333333), 1, 1.4, 5));

        // Sign inside
        var tex = makeSignTexture('🛒 Frischmarkt', '#1a4d1a', '#88ff88', 32);
        var signMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
        var signMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), signMat);
        signMesh.position.set(0, 3.4, -6.8);
        group.add(signMesh);

        // Exit marker
        group.add(makeBox(1.6, 0.05, 1.6, new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 }), 0, 0.06, 6.5));

        scene.add(group);
        interiorGroups.frischmarkt = group;

        // Interior colliders (walls at offset position)
        addColliderBox(ox,      0, -7, 16, 4, 0.5);
        addColliderBox(ox,      0,  7, 16, 4, 0.5);
        addColliderBox(ox - 8,  0,  0, 0.5, 4, 14);
        addColliderBox(ox + 8,  0,  0, 0.5, 4, 14);

        registerExit(ox, 6.5, 'frischmarkt');
    }

    // ─ Baumarkt interior ─────────────────────────────────────────────────────
    function buildBaumarktInterior() {
        var ox = INTERIOR_OFFSETS.baumarkt;
        var group = new THREE.Group();
        group.position.set(ox, 0, 0);

        buildInteriorFloorWalls(group, 18, 16, 5, 0xc8b480, 0xe0d0b0);

        // Wooden shelving racks
        var woodMat  = makeMat(0x8b5a2b);
        var metalMat = makeMat(0x888888);

        var rackPositions = [
            { x: -5, z: -4 }, { x: 0, z: -4 }, { x: 5, z: -4 },
            { x: -5, z: -1 }, { x: 5, z: -1 },
        ];
        rackPositions.forEach(function (rp) {
            // Tall shelf unit
            group.add(makeBox(0.1, 4.5, 2.5, woodMat, rp.x - 1.2, 2.25, rp.z));
            group.add(makeBox(0.1, 4.5, 2.5, woodMat, rp.x + 1.2, 2.25, rp.z));
            // Boards
            for (var b = 0; b < 4; b++) {
                group.add(makeBox(2.5, 0.08, 2.4, makeMat(0xaa7744), rp.x, 0.6 + b * 1.0, rp.z));
            }
            // Tool items on shelves
            group.add(makeBox(0.25, 0.4, 0.15, metalMat, rp.x - 0.5, 1.1, rp.z));
            group.add(makeBox(0.15, 0.6, 0.1, makeMat(0xdd4422), rp.x + 0.3, 1.2, rp.z));
        });

        // Service counter
        group.add(makeBox(5, 1.1, 1.2, makeMat(0x6a4820), 0, 0.55, 6.5));
        group.add(makeBox(5.2, 0.08, 1.3, makeMat(0x4a2e10), 0, 1.1, 6.5));

        // Big items on floor (fake appliances)
        group.add(makeBox(2, 3, 1.5, makeMat(0xbbbbbb), -6, 1.5, 3));
        group.add(makeBox(2, 3, 1.5, makeMat(0xaaaaaa), -6, 1.5, 0));

        // Sign
        var tex = makeSignTexture('🔨 Baumarkt', '#3d2b00', '#ffdd55', 32);
        var signMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
        var signMesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.2), signMat);
        signMesh.position.set(0, 4.5, -7.8);
        group.add(signMesh);

        // Exit pad
        group.add(makeBox(1.6, 0.05, 1.6, new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 }), 0, 0.06, 7.5));

        scene.add(group);
        interiorGroups.baumarkt = group;

        addColliderBox(ox,      0, -8, 18, 5, 0.5);
        addColliderBox(ox,      0,  8, 18, 5, 0.5);
        addColliderBox(ox - 9,  0,  0, 0.5, 5, 16);
        addColliderBox(ox + 9,  0,  0, 0.5, 5, 16);

        registerExit(ox, 7.5, 'baumarkt');
    }

    // ─ La Famiglia interior ───────────────────────────────────────────────────
    function buildLaFamigliaInterior() {
        var ox = INTERIOR_OFFSETS.la_famiglia;
        var group = new THREE.Group();
        group.position.set(ox, 0, 0);

        buildInteriorFloorWalls(group, 14, 12, 4, 0x1a0a0a, 0x2a0a0a);

        // Red ambient light (represented by emissive walls)
        var darkRedMat = makeMat(0x330000, 0x110000);
        // Repaint walls with dark red
        // (already set via buildInteriorFloorWalls; we overlay red panels)
        group.add(makeBox(14, 4, 0.05, darkRedMat, 0, 2, -5.9));
        group.add(makeBox(14, 4, 0.05, darkRedMat, 0, 2, 5.9));

        // Bar counter L-shape
        var barMat = makeMat(0x2a1a0a);
        var barTop = makeMat(0x5c3a1a, 0x110500);
        group.add(makeBox(6, 1.2, 0.9, barMat, -3.5, 0.6, -4));
        group.add(makeBox(0.9, 1.2, 3, barMat, -6, 0.6, -2.5));
        // Bar top
        group.add(makeBox(6.2, 0.08, 0.95, barTop, -3.5, 1.2, -4));

        // Bar stools
        var stoolMat = makeMat(0x661111);
        for (var s = 0; s < 4; s++) {
            group.add(makeBox(0.5, 0.05, 0.5, stoolMat, -5.5 + s * 1.5, 0.85, -3.1));
            group.add(makeBox(0.08, 0.85, 0.08, makeMat(0x333333), -5.5 + s * 1.5 - 0.2, 0.42, -3.1));
            group.add(makeBox(0.08, 0.85, 0.08, makeMat(0x333333), -5.5 + s * 1.5 + 0.2, 0.42, -3.1));
        }

        // Tables
        var tableMat = makeMat(0x3a1a0a);
        var tablePositions = [
            { x: 2, z: -3 }, { x: 5, z: -3 }, { x: 2, z: 1 }, { x: 5, z: 1 },
        ];
        tablePositions.forEach(function (tp) {
            // Table
            group.add(makeBox(1.5, 0.07, 1.5, tableMat, tp.x, 0.9, tp.z));
            group.add(makeBox(0.08, 0.9, 0.08, makeMat(0x2a1000), tp.x - 0.6, 0.45, tp.z - 0.6));
            group.add(makeBox(0.08, 0.9, 0.08, makeMat(0x2a1000), tp.x + 0.6, 0.45, tp.z - 0.6));
            group.add(makeBox(0.08, 0.9, 0.08, makeMat(0x2a1000), tp.x - 0.6, 0.45, tp.z + 0.6));
            group.add(makeBox(0.08, 0.9, 0.08, makeMat(0x2a1000), tp.x + 0.6, 0.45, tp.z + 0.6));
            // Chairs
            group.add(makeBox(0.65, 0.05, 0.65, stoolMat, tp.x, 0.6, tp.z - 1.1));
            group.add(makeBox(0.65, 0.05, 0.65, stoolMat, tp.x, 0.6, tp.z + 1.1));
        });

        // Sign
        var tex = makeSignTexture('🍷 La Famiglia', '#1a0000', '#ff4444', 32);
        var signMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
        var signMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), signMat);
        signMesh.position.set(0, 3.4, -5.8);
        group.add(signMesh);

        // Exit pad
        group.add(makeBox(1.6, 0.05, 1.6, new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 }), 0, 0.06, 5.5));

        scene.add(group);
        interiorGroups.la_famiglia = group;

        addColliderBox(ox,      0, -6, 14, 4, 0.5);
        addColliderBox(ox,      0,  6, 14, 4, 0.5);
        addColliderBox(ox - 7,  0,  0, 0.5, 4, 12);
        addColliderBox(ox + 7,  0,  0, 0.5, 4, 12);

        registerExit(ox, 5.5, 'la_famiglia');
    }

    // ─ Police Station interior ────────────────────────────────────────────────
    function buildPoliceStationInterior() {
        var ox = INTERIOR_OFFSETS.police_station;
        var group = new THREE.Group();
        group.position.set(ox, 0, 0);

        buildInteriorFloorWalls(group, 20, 16, 4.5, 0xd0ccc0, 0xc0bcb0);

        // Reception desk
        var deskMat = makeMat(0x556644);
        group.add(makeBox(5, 1.2, 1, deskMat, 0, 0.6, -4));
        group.add(makeBox(5.2, 0.08, 1.1, makeMat(0x445533), 0, 1.2, -4));
        // Reception computer
        group.add(makeBox(0.5, 0.4, 0.05, makeMat(0x222222), 0.5, 1.45, -4.5));
        group.add(makeBox(0.6, 0.05, 0.4, makeMat(0x333333), 0.5, 1.25, -4.2));

        // Officer desks (2)
        var deskPositions = [{ x: -5, z: 1 }, { x: 5, z: 1 }];
        deskPositions.forEach(function (dp) {
            group.add(makeBox(3, 0.9, 1.5, deskMat, dp.x, 0.45, dp.z));
            group.add(makeBox(3.2, 0.07, 1.6, makeMat(0x445533), dp.x, 0.9, dp.z));
            // Monitor
            group.add(makeBox(0.6, 0.45, 0.05, makeMat(0x111111), dp.x, 1.35, dp.z - 0.7));
            group.add(makeBox(0.7, 0.05, 0.4, makeMat(0x222222), dp.x, 1.12, dp.z - 0.5));
            // Chair
            group.add(makeBox(0.7, 0.05, 0.7, makeMat(0x334422), dp.x, 0.55, dp.z + 1));
            group.add(makeBox(0.7, 0.6, 0.05, makeMat(0x334422), dp.x, 0.85, dp.z + 1.35));
        });

        // Flag on wall (German flag colours)
        var flagPole = makeBox(0.06, 2, 0.06, makeMat(0x888888), 8.5, 3, -7.8);
        group.add(flagPole);
        group.add(makeBox(1.5, 0.55, 0.04, makeMat(0x111111), 7.7, 3.8, -7.8));
        group.add(makeBox(1.5, 0.55, 0.04, makeMat(0xdd0000), 7.7, 3.25, -7.8));
        group.add(makeBox(1.5, 0.55, 0.04, makeMat(0xffcc00), 7.7, 2.7, -7.8));

        // Police seal on wall
        var sealTex = makeSignTexture('POLIZEI', '#002266', '#ffffff', 28);
        var sealMat = new THREE.MeshBasicMaterial({ map: sealTex, transparent: true, side: THREE.DoubleSide });
        var sealMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), sealMat);
        sealMesh.position.set(-5, 3.5, -7.8);
        group.add(sealMesh);

        // Sign
        var tex = makeSignTexture('🚔 Polizeipräsidium', '#002266', '#4488ff', 26);
        var signMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
        var signMesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.2), signMat);
        signMesh.position.set(0, 4.0, -7.8);
        group.add(signMesh);

        // Exit pad
        group.add(makeBox(1.6, 0.05, 1.6, new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 }), 0, 0.06, 7.5));

        scene.add(group);
        interiorGroups.police_station = group;

        addColliderBox(ox,      0, -8, 20, 4.5, 0.5);
        addColliderBox(ox,      0,  8, 20, 4.5, 0.5);
        addColliderBox(ox - 10, 0,  0, 0.5, 4.5, 16);
        addColliderBox(ox + 10, 0,  0, 0.5, 4.5, 16);

        registerExit(ox, 7.5, 'police_station');
    }

    // ─ Apartments interior (lobby) ────────────────────────────────────────────
    function buildApartmentsInterior() {
        var ox = INTERIOR_OFFSETS.apartments;
        var group = new THREE.Group();
        group.position.set(ox, 0, 0);

        buildInteriorFloorWalls(group, 16, 12, 5, 0xd4c8aa, 0xccc0a8);

        // Lobby desk
        var deskMat = makeMat(0x8a6840);
        group.add(makeBox(4, 1.1, 0.9, deskMat, 0, 0.55, -4));
        group.add(makeBox(4.2, 0.08, 1.0, makeMat(0x6a4820), 0, 1.1, -4));

        // Elevator doors (fake, just panels)
        var elevMat = makeMat(0x888880);
        group.add(makeBox(1.8, 3.5, 0.1, elevMat, -4, 1.75, -5.8));
        group.add(makeBox(1.8, 3.5, 0.1, elevMat,  0, 1.75, -5.8));
        group.add(makeBox(1.8, 3.5, 0.1, elevMat,  4, 1.75, -5.8));
        // Elevator button panels
        for (var e = 0; e < 3; e++) {
            group.add(makeBox(0.25, 0.6, 0.06, makeMat(0x444444), -4 + e * 4 + 1.2, 1.4, -5.75));
        }

        // Mailboxes on wall
        var mbMat = makeMat(0x666655);
        for (var mb = 0; mb < 8; mb++) {
            group.add(makeBox(0.5, 0.35, 0.1, mbMat, -3.5 + mb * 1.0, 1.5 + (mb % 2 === 0 ? 0 : 0.4), 5.8));
        }

        // Potted plant
        var potMat  = makeMat(0x8b4513);
        var leafMat = makeMat(0x228822);
        group.add(makeBox(0.6, 0.7, 0.6, potMat, 6, 0.35, -4));
        group.add(makeBox(1, 1, 1, leafMat, 6, 1.2, -4));

        // Sofa / seating
        var sofaMat = makeMat(0x6688aa);
        group.add(makeBox(2.5, 0.4, 0.9, sofaMat, -5.5, 0.4, 2));
        group.add(makeBox(2.5, 0.7, 0.2, sofaMat, -5.5, 0.55, 2.55));
        group.add(makeBox(0.2, 0.7, 0.9, sofaMat, -6.65, 0.55, 2));
        group.add(makeBox(0.2, 0.7, 0.9, sofaMat, -4.35, 0.55, 2));

        // Sign
        var tex = makeSignTexture('🏠 Apartmenthaus', '#3d2800', '#ffcc88', 28);
        var signMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
        var signMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1), signMat);
        signMesh.position.set(0, 4.5, -5.8);
        group.add(signMesh);

        // Exit pad
        group.add(makeBox(1.6, 0.05, 1.6, new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 }), 0, 0.06, 5.5));

        scene.add(group);
        interiorGroups.apartments = group;

        addColliderBox(ox,      0, -6, 16, 5, 0.5);
        addColliderBox(ox,      0,  6, 16, 5, 0.5);
        addColliderBox(ox - 8,  0,  0, 0.5, 5, 12);
        addColliderBox(ox + 8,  0,  0, 0.5, 5, 12);

        registerExit(ox, 5.5, 'apartments');
    }

    // ── Public API ────────────────────────────────────────────────────────────

    function init(sceneRef, colliders) {
        scene = sceneRef;
        colliderList = colliders;

        buildStreet();
        buildFrischmarkt();
        buildBaumarkt();
        buildLaFamiglia();
        buildPoliceStation();
        buildApartments();
        buildPark();

        buildFrischmarktInterior();
        buildBaumarktInterior();
        buildLaFamigliaInterior();
        buildPoliceStationInterior();
        buildApartmentsInterior();
    }

    function update(delta, playerPos) {
        if (!playerPos) return null;

        // ── Check for exit from interior ────────────────────────────────────
        if (playerInside && currentBuilding) {
            var ox = INTERIOR_OFFSETS[currentBuilding];
            for (var ei = 0; ei < exitTriggers.length; ei++) {
                var et = exitTriggers[ei];
                if (et.id !== currentBuilding) continue;
                var edx = playerPos.x - et.x;
                var edz = playerPos.z - et.z;
                var eDist = Math.sqrt(edx * edx + edz * edz);
                if (eDist < et.radius) {
                    // Teleport player back outside
                    var exitBuilding = currentBuilding;
                    playerInside = false;
                    currentBuilding = null;
                    return { exited: exitBuilding, returnPos: playerPreTeleportPos };
                }
            }
            return null;
        }

        // ── Check for entry into building ────────────────────────────────────
        for (var di = 0; di < doorTriggers.length; di++) {
            var dt = doorTriggers[di];
            var dx = playerPos.x - dt.x;
            var dz = playerPos.z - dt.z;
            var dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < dt.radius) {
                playerPreTeleportPos = { x: playerPos.x, y: playerPos.y, z: playerPos.z };
                playerInside = true;
                currentBuilding = dt.id;
                var intOx = INTERIOR_OFFSETS[dt.id];
                return { entered: dt.id, teleportTo: { x: intOx, y: 0, z: 0 } };
            }
        }

        return null;
    }

    function getShopInventory(shopId) {
        return SHOP_INVENTORIES[shopId] ? SHOP_INVENTORIES[shopId].slice() : [];
    }

    return {
        init: init,
        update: update,
        LOCATIONS: LOCATIONS,
        getShopInventory: getShopInventory,
        getPlayerInside: function () { return playerInside; },
        getCurrentBuilding: function () { return currentBuilding; },
        getInteriorOffset: function (id) { return INTERIOR_OFFSETS[id]; },
    };
}());
