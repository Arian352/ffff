// ai.js - NPC AI system for Pizza Empire
// Manages citizen NPCs with daily schedules and city movement
var AI = (function () {
    'use strict';

    // ── Internal state ────────────────────────────────────────────────────────
    var scene = null;
    var ROOM = null;
    var cityLocations = null;
    var npcs = [];

    // ── NPC definitions ───────────────────────────────────────────────────────
    // Schedule keys are hours (0-23). Value is a LOCATIONS key or special pos.
    var NPC_DEFINITIONS = [
        {
            name: 'Klaus',
            bodyColor:  0x2244aa,   // blue shirt
            pantsColor: 0x555566,   // gray pants
            hairColor:  0x553311,
            skinColor:  0xf0c080,
            schedule: {
                0:  'apartments',
                8:  'baumarkt',
                12: 'park',
                16: 'restaurant',
                20: 'apartments',
            },
            dialogLines: [
                'Ich höre, der neue Pizzaladen läuft gut.',
                'Diese Gegend verändert sich...',
                'Russoni? Den Namen kenne ich.',
                'Schöner Tag heute.',
                'Arbeit wartet immer irgendwo.',
            ],
            personality: 'friendly',
        },
        {
            name: 'Maria',
            bodyColor:  0xeedd22,   // yellow dress
            pantsColor: 0xeedd22,
            hairColor:  0x110800,
            skinColor:  0xf0c888,
            schedule: {
                0:  'apartments',
                9:  'frischmarkt',
                12: 'apartments',
                15: 'park',
                20: 'apartments',
            },
            dialogLines: [
                'Haben Sie frisches Basilikum gesehen?',
                'Der Markt hat heute gute Angebote.',
                'Ich liebe dieses Viertel.',
                'Vorsicht mit den Leuten im Dunkeln.',
            ],
            personality: 'friendly',
        },
        {
            name: 'Giulio',
            bodyColor:  0x227744,   // green jacket
            pantsColor: 0x222222,
            hairColor:  0x110808,
            skinColor:  0xd4a060,
            schedule: {
                0:  'apartments',
                8:  'restaurant',
                13: 'la_famiglia',
                19: 'apartments',
                23: 'la_famiglia',
            },
            dialogLines: [
                'Bestes Essen hier ist die Pizza.',
                'La Famiglia hat heute Nacht Gäste.',
                'Vorsicht, Freund.',
                'Man sieht sich.',
                'Ich sage nichts weiter.',
            ],
            personality: 'suspicious',
        },
        {
            name: 'Petra',
            bodyColor:  0xff88aa,   // pink top
            pantsColor: 0x335588,
            hairColor:  0xddaa22,
            skinColor:  0xf4c898,
            schedule: {
                0:  'apartments',
                8:  'frischmarkt',
                11: 'park',
                17: 'apartments',
            },
            dialogLines: [
                'Dieser Kiez war früher ruhiger.',
                'Kaufen Sie immer beim Frischmarkt!',
                'Schöner Abend, nicht wahr?',
                'Ich muss noch einkaufen.',
            ],
            personality: 'friendly',
        },
        {
            name: 'Boris',
            bodyColor:  0x111111,   // dark hoodie
            pantsColor: 0x1a1a1a,
            hairColor:  0x222222,
            skinColor:  0xd08050,
            schedule: {
                0:  'la_famiglia',
                8:  'la_famiglia',
                14: 'la_famiglia',
                22: 'street_north',
                23: 'street_north',
            },
            dialogLines: [
                'Was willst du?',
                'Hier gibt es nichts zu sehen.',
                'Marco schickt Grüße.',
                'Verschwinde.',
                'Ich hab Zeit. Du nicht.',
            ],
            personality: 'suspicious',
        },
        {
            name: 'Lena',
            bodyColor:  0xffffff,   // white blouse
            pantsColor: 0x224488,
            hairColor:  0x885522,
            skinColor:  0xf5d0a0,
            schedule: {
                0:  'apartments',
                8:  'police_station',
                17: 'park',
                21: 'apartments',
            },
            dialogLines: [
                'Wir beobachten die Aktivitäten in dieser Straße genau.',
                'Kennen Sie einen gewissen Marco Russoni?',
                'Bleiben Sie aus dem Weg der Ermittlungen.',
                'Guten Tag.',
                'Alles ruhig hier?',
            ],
            personality: 'nervous',
        },
        {
            name: 'Fritz',
            bodyColor:  0x887766,   // old coat
            pantsColor: 0x554433,
            hairColor:  0xdddddd,   // white hair
            skinColor:  0xd4a870,
            schedule: {
                0:  'apartments',
                7:  'park',
                18: 'restaurant',
                22: 'apartments',
            },
            dialogLines: [
                'Früher war das hier ein ehrlicher Kiez.',
                'Die jungen Leute von heute...',
                'Dein Onkel und ich, wir kannten uns.',
                'Ich sitze hier jeden Tag. Jeden Tag.',
                'Diese Welt dreht sich zu schnell.',
            ],
            personality: 'friendly',
        },
        {
            name: 'Tim',    // Kid 1
            bodyColor:  0x4488ff,
            pantsColor: 0xdd4422,
            hairColor:  0xddaa22,
            skinColor:  0xf8d090,
            schedule: {
                0:  'apartments',
                7:  'park',
                17: 'apartments',
            },
            dialogLines: [
                'Haha, pass auf!',
                'Ich kann höher springen als du!',
                'Lass uns Fußball spielen.',
            ],
            personality: 'friendly',
            isKid: true,
        },
        {
            name: 'Anna',   // Kid 2
            bodyColor:  0xff88ee,
            pantsColor: 0x6644aa,
            hairColor:  0x442200,
            skinColor:  0xf8d090,
            schedule: {
                0:  'apartments',
                7:  'park',
                17: 'apartments',
            },
            dialogLines: [
                'Darf ich mitspielen?',
                'Schau mal, ein Vogel!',
                'Mama sagt, wir müssen bald rein.',
            ],
            personality: 'friendly',
            isKid: true,
        },
        {
            name: 'Greta',  // Baker
            bodyColor:  0xf0e8d8,   // flour-white apron
            pantsColor: 0x884422,
            hairColor:  0xbb7733,
            skinColor:  0xf4ccA0,
            schedule: {
                0:  'apartments',
                5:  'frischmarkt',
                11: 'market',
                14: 'frischmarkt',
                19: 'apartments',
            },
            dialogLines: [
                'Frisches Brot, noch warm aus dem Ofen!',
                'Ich stehe jeden Morgen um vier Uhr auf. Jeden Morgen!',
                'Dein Pizzateig? Nicht schlecht. Aber mein Sauerteig ist besser.',
                'Auf dem Marktplatz verkaufe ich mittags meine Brezeln.',
                'Mehl, Wasser, Salz und Liebe. Mehr braucht es nicht.',
            ],
            personality: 'friendly',
        },
        {
            name: 'Hans',   // Fisherman
            bodyColor:  0x336688,   // weathered blue jacket
            pantsColor: 0x445544,
            hairColor:  0x999988,
            skinColor:  0xd8a878,
            schedule: {
                0:  'apartments',
                6:  'fountain',
                12: 'market',
                15: 'park',
                20: 'apartments',
            },
            dialogLines: [
                'Früher habe ich am großen Fluss geangelt. Jetzt nur noch am Brunnen gesessen.',
                'Der Fang war heute mager. Wie immer.',
                'Fisch auf Pizza? Sag bloß, du machst sowas.',
                'Geduld, Junge. Beim Angeln lernt man Geduld.',
                'Das Wasser im Brunnen ist sauberer als mancher Mensch hier.',
            ],
            personality: 'friendly',
        },
        {
            name: 'Yusuf',  // Market vendor
            bodyColor:  0xcc6622,   // orange vendor vest
            pantsColor: 0x333344,
            hairColor:  0x1a0e06,
            skinColor:  0xc89058,
            schedule: {
                0:  'apartments',
                7:  'market',
                18: 'fountain',
                21: 'apartments',
            },
            dialogLines: [
                'Frisches Gemüse! Beste Qualität im ganzen Dorf!',
                'Für dich mache ich einen Sonderpreis, mein Freund.',
                'Meine Tomaten sind süßer als die vom Frischmarkt. Ehrenwort.',
                'Ein Markt ohne Kunden ist wie eine Pizza ohne Käse.',
                'Komm morgen wieder, dann gibt es frische Paprika.',
            ],
            personality: 'friendly',
        },
        {
            name: 'Elena',  // Gossip
            bodyColor:  0xaa44aa,   // purple coat
            pantsColor: 0x662266,
            hairColor:  0x332211,
            skinColor:  0xf0c090,
            schedule: {
                0:  'apartments',
                9:  'village_west',
                11: 'market',
                14: 'fountain',
                17: 'frischmarkt',
                20: 'apartments',
            },
            dialogLines: [
                'Hast du schon gehört? Die Leute reden über deinen Laden!',
                'Man sagt, in der La Famiglia Bar gehen seltsame Gestalten ein und aus.',
                'Bruno hat sich schon wieder über den Lärm beschwert. Typisch.',
                'Ich sage ja nichts, ich weiß ja nur alles.',
                'Sofia und Karl? Frisch verliebt, die beiden. Sieht doch jeder.',
                'Bleib stehen, ich habe Neuigkeiten!',
            ],
            personality: 'friendly',
        },
        {
            name: 'Bruno',  // Grumpy pensioner
            bodyColor:  0x554444,   // drab brown cardigan
            pantsColor: 0x3a3a3a,
            hairColor:  0xcccccc,
            skinColor:  0xd8b088,
            schedule: {
                0:  'apartments',
                8:  'park',
                12: 'market',
                16: 'village_east',
                19: 'apartments',
            },
            dialogLines: [
                'Was guckst du so? Hab ich was im Gesicht?',
                'Früher war der Marktplatz noch sauber. Früher!',
                'Pizza, Pizza, Pizza. Was ist mit anständiger Hausmannskost?',
                'Die Kinder am Brunnen machen einen Krach, unerträglich.',
                'Lass mich in Ruhe meine Runde drehen.',
            ],
            personality: 'suspicious',
        },
        {
            name: 'Sofia',  // Young couple (with Karl)
            bodyColor:  0xee5566,   // red summer dress
            pantsColor: 0xee5566,
            hairColor:  0x221100,
            skinColor:  0xeec498,
            schedule: {
                0:  'apartments',
                9:  'fountain',
                13: 'park',
                17: 'market',
                21: 'restaurant',
                23: 'apartments',
            },
            dialogLines: [
                'Karl und ich essen heute Abend bei dir, versprochen!',
                'Der Brunnen ist mein Lieblingsplatz im ganzen Dorf.',
                'Ist das nicht ein wunderschöner Tag?',
                'Karl hat mir Blumen vom Markt mitgebracht. Süß, oder?',
                'Eine Pizza mit extra Basilikum, das wäre jetzt was.',
            ],
            personality: 'friendly',
        },
        {
            name: 'Karl',   // Young couple (with Sofia)
            bodyColor:  0x4466cc,   // smart blue shirt
            pantsColor: 0x222831,
            hairColor:  0x442e11,
            skinColor:  0xeac08c,
            schedule: {
                0:  'apartments',
                9:  'fountain',
                13: 'park',
                17: 'market',
                21: 'restaurant',
                23: 'apartments',
            },
            dialogLines: [
                'Hast du Sofia gesehen? Wir wollten uns am Brunnen treffen.',
                'Ich spare für einen Ring. Aber psst, kein Wort zu Elena!',
                'Zwei Pizzen für heute Abend, die beste, die du hast!',
                'Das Dorf ist klein, aber für uns ist es perfekt.',
                'Sofia mag Oliven. Ich merke mir sowas.',
            ],
            personality: 'friendly',
        },
        {
            name: 'Mia',    // Kid 3, plays at the fountain
            bodyColor:  0x66dd88,
            pantsColor: 0xeeaa33,
            hairColor:  0x884411,
            skinColor:  0xf8d8a8,
            schedule: {
                0:  'apartments',
                8:  'fountain',
                13: 'park',
                16: 'fountain',
                18: 'apartments',
            },
            dialogLines: [
                'Ich kann Münzen in den Brunnen werfen, ganz weit!',
                'Tim und Anna spielen immer im Park, aber der Brunnen ist viel besser!',
                'Hast du eine Pizza dabei? Biiiitte!',
                'Pass auf, gleich spritzt das Wasser!',
            ],
            personality: 'friendly',
            isKid: true,
        },
    ];

    // ── Humanoid mesh builder ─────────────────────────────────────────────────
    function makeMat(color, emissive) {
        return new THREE.MeshLambertMaterial({
            color: color,
            emissive: emissive !== undefined ? emissive : 0x000000,
        });
    }

    function buildHumanoid(def) {
        var group = new THREE.Group();
        var scale = def.isKid ? 0.7 : 1.0;

        var skinMat  = makeMat(def.skinColor);
        var bodyMat  = makeMat(def.bodyColor);
        var pantsMat = makeMat(def.pantsColor);
        var hairMat  = makeMat(def.hairColor);
        var shoeMat  = makeMat(0x222211);

        // Head
        var head = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.6 * scale, 0.55 * scale), skinMat);
        head.position.set(0, 1.85 * scale, 0);
        group.add(head);

        // Hair (top slab)
        var hair = new THREE.Mesh(new THREE.BoxGeometry(0.57 * scale, 0.2 * scale, 0.57 * scale), hairMat);
        hair.position.set(0, 2.2 * scale, 0);
        group.add(hair);

        // Eyes (dark dots on head front)
        var eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        var eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.1 * scale, 0.05), eyeMat);
        eyeL.position.set(-0.13 * scale, 1.88 * scale, 0.28 * scale);
        var eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.1 * scale, 0.05), eyeMat);
        eyeR.position.set( 0.13 * scale, 1.88 * scale, 0.28 * scale);
        group.add(eyeL); group.add(eyeR);

        // Torso
        var torso = new THREE.Mesh(new THREE.BoxGeometry(0.65 * scale, 0.8 * scale, 0.4 * scale), bodyMat);
        torso.position.set(0, 1.2 * scale, 0);
        group.add(torso);

        // Left arm
        var armL = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.7 * scale, 0.2 * scale), bodyMat);
        armL.position.set(-0.45 * scale, 1.15 * scale, 0);
        group.add(armL);

        // Right arm
        var armR = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.7 * scale, 0.2 * scale), bodyMat);
        armR.position.set( 0.45 * scale, 1.15 * scale, 0);
        group.add(armR);

        // Hands
        var handMat = skinMat;
        var handL = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.2 * scale, 0.2 * scale), handMat);
        handL.position.set(-0.45 * scale, 0.73 * scale, 0);
        var handR = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.2 * scale, 0.2 * scale), handMat);
        handR.position.set( 0.45 * scale, 0.73 * scale, 0);
        group.add(handL); group.add(handR);

        // Left leg
        var legL = new THREE.Mesh(new THREE.BoxGeometry(0.28 * scale, 0.75 * scale, 0.28 * scale), pantsMat);
        legL.position.set(-0.18 * scale, 0.55 * scale, 0);
        group.add(legL);

        // Right leg
        var legR = new THREE.Mesh(new THREE.BoxGeometry(0.28 * scale, 0.75 * scale, 0.28 * scale), pantsMat);
        legR.position.set( 0.18 * scale, 0.55 * scale, 0);
        group.add(legR);

        // Left foot
        var footL = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 0.15 * scale, 0.42 * scale), shoeMat);
        footL.position.set(-0.18 * scale, 0.14 * scale, 0.07 * scale);
        group.add(footL);

        // Right foot
        var footR = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 0.15 * scale, 0.42 * scale), shoeMat);
        footR.position.set( 0.18 * scale, 0.14 * scale, 0.07 * scale);
        group.add(footR);

        // Name tag (canvas, always faces camera)
        var nameCanvas = document.createElement('canvas');
        nameCanvas.width = 256;
        nameCanvas.height = 64;
        var ctx = nameCanvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.name, 128, 32);
        var nameTex = new THREE.CanvasTexture(nameCanvas);
        var nameTagMat = new THREE.MeshBasicMaterial({ map: nameTex, transparent: true, depthTest: false, side: THREE.DoubleSide });
        var nameTag = new THREE.Mesh(new THREE.PlaneGeometry(1.2 * scale, 0.3 * scale), nameTagMat);
        nameTag.position.set(0, 2.55 * scale, 0);
        nameTag.renderOrder = 1;
        group.add(nameTag);

        // Store references for animation
        group.userData.armL = armL;
        group.userData.armR = armR;
        group.userData.legL = legL;
        group.userData.legR = legR;
        group.userData.nameTag = nameTag;
        group.userData.animTime = Math.random() * Math.PI * 2;

        return group;
    }

    // ── Get world position for a schedule entry ───────────────────────────────
    function getSchedulePos(locationKey) {
        if (!locationKey) return null;
        var loc = cityLocations[locationKey];
        if (!loc) return null;
        // Add small random offset so NPCs don't all stack on exact same point
        return {
            x: loc.x + (Math.random() - 0.5) * 3,
            z: loc.z + (Math.random() - 0.5) * 3,
        };
    }

    // ── Determine target for a given hour ─────────────────────────────────────
    function getScheduleTarget(schedule, hour) {
        var best = null;
        var bestHour = -1;
        var keys = Object.keys(schedule);
        for (var i = 0; i < keys.length; i++) {
            var h = parseInt(keys[i], 10);
            if (h <= hour && h > bestHour) {
                bestHour = h;
                best = schedule[keys[i]];
            }
        }
        if (best === null) {
            // Wrap around: take the latest hour (for times before first entry)
            for (var j = 0; j < keys.length; j++) {
                var jh = parseInt(keys[j], 10);
                if (jh > bestHour) {
                    bestHour = jh;
                    best = schedule[keys[j]];
                }
            }
        }
        return best;
    }

    // ── Spawn all NPCs ────────────────────────────────────────────────────────
    function spawnNPCs(initialHour) {
        NPC_DEFINITIONS.forEach(function (def) {
            var mesh = buildHumanoid(def);

            // Place at initial schedule position
            var targetKey = getScheduleTarget(def.schedule, initialHour !== undefined ? initialHour : 12);
            var startPos = getSchedulePos(targetKey) || { x: 0, z: 5 };

            mesh.position.set(startPos.x, 0, startPos.z);
            scene.add(mesh);

            var npc = {
                mesh: mesh,
                name: def.name,
                schedule: def.schedule,
                currentTarget: { x: startPos.x, z: startPos.z },
                arrived: true,
                dialogLines: def.dialogLines.slice(),
                personality: def.personality,
                isCitizen: true,
                isKid: !!def.isKid,
                currentLocationKey: targetKey,
                lastHour: initialHour !== undefined ? initialHour : 12,
                walkCycle: 0,
                facingPlayer: false,
                waitTimer: 0,
            };
            npcs.push(npc);
        });
    }

    // ── Animate walk cycle ────────────────────────────────────────────────────
    function animateWalk(npc, delta, moving) {
        var mesh = npc.mesh;
        var armL = mesh.userData.armL;
        var armR = mesh.userData.armR;
        var legL = mesh.userData.legL;
        var legR = mesh.userData.legR;

        if (moving) {
            npc.walkCycle += delta * 4;
            var swing = Math.sin(npc.walkCycle) * 0.4;
            if (armL) { armL.rotation.x =  swing; }
            if (armR) { armR.rotation.x = -swing; }
            if (legL) { legL.rotation.x = -swing * 0.7; }
            if (legR) { legR.rotation.x =  swing * 0.7; }
        } else {
            // Gradually return to rest
            if (armL) { armL.rotation.x *= 0.85; }
            if (armR) { armR.rotation.x *= 0.85; }
            if (legL) { legL.rotation.x *= 0.85; }
            if (legR) { legR.rotation.x *= 0.85; }
        }
    }

    // ── Keep name tag facing camera ───────────────────────────────────────────
    function updateNameTag(npc, playerPos) {
        var nameTag = npc.mesh.userData.nameTag;
        if (!nameTag || !playerPos) return;
        var dx = playerPos.x - npc.mesh.position.x;
        var dz = playerPos.z - npc.mesh.position.z;
        var angle = Math.atan2(dx, dz);
        nameTag.rotation.y = angle - npc.mesh.rotation.y;
    }

    // ── NPC movement speed ────────────────────────────────────────────────────
    var WALK_SPEED = 1.5;
    var ARRIVE_THRESHOLD = 0.3;
    var PLAYER_NOTICE_RANGE = 3.0;

    // ── Public API ────────────────────────────────────────────────────────────

    function init(sceneRef, roomRef, cityLocationsRef) {
        scene = sceneRef;
        ROOM = roomRef;
        cityLocations = cityLocationsRef;
        npcs = [];
        spawnNPCs(12);  // Start at noon
    }

    function update(delta, timeOfDay, playerPos) {
        if (!npcs.length) return;
        var hour = (timeOfDay !== undefined && timeOfDay !== null)
            ? Math.floor(timeOfDay)
            : 12;

        for (var i = 0; i < npcs.length; i++) {
            var npc = npcs[i];
            var mesh = npc.mesh;

            // ── Hour change: recalculate schedule target ──────────────────────
            if (hour !== npc.lastHour) {
                npc.lastHour = hour;
                var newKey = getScheduleTarget(npc.schedule, hour);
                if (newKey !== npc.currentLocationKey) {
                    npc.currentLocationKey = newKey;
                    var newPos = getSchedulePos(newKey);
                    if (newPos) {
                        npc.currentTarget = newPos;
                        npc.arrived = false;
                    }
                }
            }

            // ── Check if player is nearby (stop and face) ─────────────────────
            var facingPlayer = false;
            if (playerPos) {
                var pdx = playerPos.x - mesh.position.x;
                var pdz = playerPos.z - mesh.position.z;
                var playerDist = Math.sqrt(pdx * pdx + pdz * pdz);
                if (playerDist < PLAYER_NOTICE_RANGE) {
                    facingPlayer = true;
                    // Face toward player
                    var faceAngle = Math.atan2(pdx, pdz);
                    mesh.rotation.y = faceAngle;
                }
            }
            npc.facingPlayer = facingPlayer;

            // ── Move toward target if not arrived and not facing player ───────
            var moving = false;
            if (!npc.arrived && !facingPlayer) {
                var tx = npc.currentTarget.x;
                var tz = npc.currentTarget.z;
                var dx = tx - mesh.position.x;
                var dz = tz - mesh.position.z;
                var dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < ARRIVE_THRESHOLD) {
                    npc.arrived = true;
                    mesh.position.x = tx;
                    mesh.position.z = tz;
                    npc.waitTimer = 0;
                } else {
                    var speed = WALK_SPEED * delta;
                    var norm = dist > 0 ? 1 / dist : 0;
                    mesh.position.x += dx * norm * speed;
                    mesh.position.z += dz * norm * speed;
                    mesh.position.y = 0;

                    // Face direction of travel
                    var moveAngle = Math.atan2(dx, dz);
                    mesh.rotation.y = moveAngle;
                    moving = true;
                }
            } else if (npc.arrived) {
                npc.waitTimer += delta;
                // Idle: small bobbing in place
                var bob = Math.sin(npc.waitTimer * 1.2) * 0.01;
                mesh.position.y = bob;
            }

            // ── Walk animation ────────────────────────────────────────────────
            animateWalk(npc, delta, moving);

            // ── Name tag billboard ────────────────────────────────────────────
            updateNameTag(npc, playerPos);
        }
    }

    function getNearbyNPC(playerPos, radius) {
        if (!playerPos) return null;
        var nearest = null;
        var nearestDist = Infinity;
        for (var i = 0; i < npcs.length; i++) {
            var npc = npcs[i];
            var dx = playerPos.x - npc.mesh.position.x;
            var dz = playerPos.z - npc.mesh.position.z;
            var dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < radius && dist < nearestDist) {
                nearestDist = dist;
                nearest = npc;
            }
        }
        return nearest;
    }

    function clearAll() {
        for (var i = 0; i < npcs.length; i++) {
            if (npcs[i].mesh && scene) {
                scene.remove(npcs[i].mesh);
            }
        }
        npcs = [];
    }

    function getNPCs() {
        return npcs;
    }

    return {
        init: init,
        update: update,
        getNearbyNPC: getNearbyNPC,
        clearAll: clearAll,
        getNPCs: getNPCs,
    };
}());
