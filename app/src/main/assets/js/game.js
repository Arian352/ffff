// ============================================
// PIZZA EMPIRE – MAIN GAME LOGIC (3D Edition)
// ============================================
'use strict';

const SAVE_KEY = 'pizza_empire_save_v2';

const DEFAULT_STATE = {
  day: 1,
  money: 350,
  reputation: 1,
  repPoints: 0,
  morality: 0,
  gangTrust: 0,
  policeTrust: 0,
  gangEvent: null,
  policeEvent: null,
  storyFlags: {},
  inventory: { sauce:5, cheese:5, salami:3, mushrooms:3, peppers:2, olives:2, basil:3, pineapple:0, dough:8 },
  upgrades: { oven:1, decor:1, dining:1, recipes:1, signage:0, delivery:0 },
  staff: { cook:false, waiter:false, delivery:false },
  stats: { pizzasMade:0, totalEarned:0, customersServed:0 },
  todayExpenses: 0,
  todayRevenue: 0,
  gangWarningShown: false,
  policeVisitShown: false,
  finalDecisionUnlocked: false,
  timeOfDay: 10,
};

const RECIPES = {
  margherita: { name:'Margherita',  toppings:['sauce','cheese','basil'],                     price:9  },
  salami:     { name:'Salami',      toppings:['sauce','cheese','salami'],                     price:11 },
  veggie:     { name:'Veggie',      toppings:['sauce','cheese','peppers','mushrooms','olives'], price:12 },
  hawaii:     { name:'Hawaii',      toppings:['sauce','cheese','pineapple'],                  price:11 },
  special:    { name:'Speciale',    toppings:['sauce','cheese','salami','peppers','mushrooms'],price:14 },
};

const SHOP_ITEMS = [
  { id:'sauce',     name:'Tomatensauce', desc:'5 Portionen', price:8,  qty:5 },
  { id:'cheese',    name:'Mozzarella',   desc:'5 Portionen', price:10, qty:5 },
  { id:'dough',     name:'Pizzateig',    desc:'8 Portionen', price:7,  qty:8 },
  { id:'salami',    name:'Salami',       desc:'5 Portionen', price:9,  qty:5 },
  { id:'mushrooms', name:'Champignons',  desc:'5 Portionen', price:7,  qty:5 },
  { id:'peppers',   name:'Paprika',      desc:'5 Portionen', price:6,  qty:5 },
  { id:'olives',    name:'Oliven',       desc:'4 Portionen', price:6,  qty:4 },
  { id:'basil',     name:'Basilikum',    desc:'6 Portionen', price:4,  qty:6 },
  { id:'pineapple', name:'Ananas',       desc:'4 Portionen', price:5,  qty:4, requiresRecipe:2 },
];

const UPGRADES = {
  oven:     { name:'Ofen',          maxLevel:4, costs:[0,300,600,1200], desc:['Standard-Ofen','Doppel-Ofen','Steinofen','Profi-Holzofen'],            benefit:'+Backgeschwindigkeit' },
  decor:    { name:'Einrichtung',   maxLevel:4, costs:[0,200,450,900],  desc:['Kahl','Einfach','Gemütlich','Elegant'],                                benefit:'+Kundenzufriedenheit'  },
  dining:   { name:'Speisesaal',    maxLevel:4, costs:[0,250,500,1000], desc:['4 Tische','8 Tische','14 Tische','VIP-Bereich'],                       benefit:'+Kapazität'            },
  recipes:  { name:'Rezeptbuch',    maxLevel:3, costs:[0,180,450],      desc:['Basis','Erweitert','Gourmet'],                                         benefit:'Neue Pizzen'           },
  signage:  { name:'Werbeschild',   maxLevel:1, costs:[0,150],          desc:['Kein Schild','Leuchtreklame'],                                         benefit:'+Kunden'               },
  delivery: { name:'Lieferservice', maxLevel:1, costs:[0,250],          desc:['Kein Lieferdienst','Lieferfahrrad'],                                   benefit:'+Bestellungen'         },
};

const STAFF_LIST = [
  { id:'cook',     name:'Luigi',  role:'Sous-Chef',    costPerDay:40, portrait:'unknown', requiresUpgrade:null    },
  { id:'waiter',   name:'Rosa',   role:'Servicekraft', costPerDay:30, portrait:'rosa',    requiresUpgrade:null    },
  { id:'delivery', name:'Benni',  role:'Fahrer',       costPerDay:25, portrait:'unknown', requiresUpgrade:'delivery' },
];

// ============================================================
const Game = (() => {
  let S = null;
  let currentOrders = [];
  let kitchenOrder = null;
  let kitchenToppings = [];
  let activeManagementTab = 'service';
  let nearbyNPC = null;
  let worldInitialized = false;
  let gameLoopRunning = false;
  let animId = null;

  // ---- COOKING STATE (3D Schedule-One style) ----
  const KITCHEN_POS  = { x: 2,  z: -8  };
  const COUNTER_POS  = { x: 0,  z: -5  };
  const PROX_RADIUS  = 2.5;
  const DOUGH_TAPS   = 8;

  let cookingActive   = false;
  let cookingOrderId  = null;
  let cookingStep     = 0;
  let cookingToppings = [];
  let doughTapCount   = 0;
  let _cookRedraw     = null;

  // -------- SAVE / LOAD --------
  function save() {
    if (!S) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch(e) {}
  }
  window.gameAutoSave = save;

  function load() {
    try {
      const r = localStorage.getItem(SAVE_KEY);
      if (r) return JSON.parse(r);
    } catch(e) {}
    return null;
  }

  function hasSave() { return !!load(); }

  function newGame() {
    S = JSON.parse(JSON.stringify(DEFAULT_STATE));
    currentOrders = [];
    save();
  }

  function loadGame() {
    const saved = load();
    S = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), saved || {});
    currentOrders = [];
    save();
  }

  // -------- EFFECTS --------
  function applyEffect(fx) {
    if (!S) return;
    if (fx.money)       S.money        += fx.money;
    if (fx.gangTrust)   S.gangTrust     = clamp(S.gangTrust   + fx.gangTrust,   -5,  5);
    if (fx.policeTrust) S.policeTrust   = clamp(S.policeTrust + fx.policeTrust, -5,  5);
    if (fx.morality)    S.morality      = clamp(S.morality    + fx.morality,   -10, 10);
    if (fx.reputation)  S.reputation    = clamp(S.reputation  + fx.reputation,   0,  5);
    save();
  }

  function setGangEvent(e)   { if (S) { S.gangEvent   = e; save(); } }
  function setPoliceEvent(e) { if (S) { S.policeEvent = e; save(); } }

  // -------- ORDERS --------
  function availableRecipes() {
    const lvl = S.upgrades.recipes;
    const r = ['margherita','salami'];
    if (lvl >= 2) r.push('veggie','hawaii');
    if (lvl >= 3) r.push('special');
    return r;
  }

  function generateOrder() {
    const pool = availableRecipes();
    const type = pool[Math.floor(Math.random() * pool.length)];
    const rec = RECIPES[type];
    return {
      id: Date.now() + Math.random(),
      type, name: rec.name,
      price: rec.price + Math.floor(S.reputation),
      toppings: [...rec.toppings],
      done: false,
      urgent: Math.random() < 0.25,
    };
  }

  function refillOrders() {
    const cap = 2 + S.upgrades.dining + (S.staff.waiter ? 1 : 0);
    while (currentOrders.filter(o => !o.done).length < cap) {
      currentOrders.push(generateOrder());
    }
  }

  // -------- 3D WORLD INIT --------
  function initWorld() {
    // Show loading screen
    showScreen('screen-loading');
    updateLoading(10, 'Three.js wird gestartet…');

    const canvas = document.getElementById('game-canvas');
    if (typeof World === 'undefined' || typeof Player === 'undefined' || typeof NPCs === 'undefined') {
      // 3D engine not available – fallback 2D mode
      console.warn('3D engine not loaded, running in 2D mode');
      updateLoading(100, 'Lädt…');
      setTimeout(() => { startGameLoop2D(); }, 500);
      return;
    }

    updateLoading(25, 'Welt wird gebaut…');
    setTimeout(() => {
      try {
        canvas.style.display = 'block';
        World.init(canvas);
        const scene = World.scene;
        const renderer = World.renderer;
        updateLoading(55, 'Charaktere werden gespawnt…');
        setTimeout(() => {
          const camera = Player.init(scene);
          updateLoading(75, 'Story wird geladen…');
          setTimeout(() => {
            NPCs.init(scene, S, World.ROOM);
            updateLoading(95, 'Fast fertig…');
            setTimeout(() => {
              worldInitialized = true;
              updateLoading(100, 'Los geht\'s!');
              setTimeout(() => { startGameLoop3D(scene, renderer, camera); }, 300);
            }, 200);
          }, 100);
        }, 100);
      } catch(err) {
        console.error('3D init failed:', err);
        startGameLoop2D();
      }
    }, 100);
  }

  function updateLoading(pct, text) {
    const bar = document.getElementById('loading-bar');
    const txt = document.getElementById('loading-text');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = text;
    const lp = document.getElementById('loading-pizza');
    if (lp && !lp.innerHTML) lp.innerHTML = buildPizzaSVG(['sauce','cheese','salami'], 100);
  }

  // -------- GAME LOOP (3D) --------
  function startGameLoop3D(scene, renderer, camera) {
    showScreen(null); // hide all screens, show 3D
    canvas3D_show();
    touchControls_show();
    refillOrders();
    updateHUD3D();
    gameLoopRunning = true;
    Story.init();

    // Check day 1 story
    if (S.day === 1 && !S.storyFlags.intro_done) {
      S.storyFlags.intro_done = true;
      save();
      Story.playChapter('intro', () => { canvas3D_show(); touchControls_show(); });
    }

    const clock = World.clock;
    let gameTime = S.timeOfDay || 10;
    const DAY_SPEED = 0.5; // in-game hours per real second

    function loop() {
      animId = requestAnimationFrame(loop);
      const delta = Math.min(clock.getDelta(), 0.05);

      try {
        // Advance in-game time
        gameTime += delta * DAY_SPEED;
        if (gameTime >= 24) { gameTime = 0; }
        S.timeOfDay = gameTime;
        World.updateTimeOfDay(gameTime);
      } catch(e) {}

      let playerState;
      try {
        const colliders = World.colliders;
        playerState = Player.update(delta, colliders);
      } catch(e) {}

      let near = null;
      try {
        const pp = Player.getPosition();
        const playerVec = new THREE.Vector3(pp.x, pp.y, pp.z);
        near = NPCs.update(delta, playerVec, camera);
        nearbyNPC = near;
      } catch(e) {}

      // Show/hide interact prompt
      const prompt = document.getElementById('interact-prompt');
      if (prompt) {
        if (near) {
          prompt.classList.remove('hidden');
          const lbl = document.getElementById('btn-interact');
          if (lbl) {
            const name = near.isCitizen ? (near.citizen && near.citizen.name || 'Bürger') : (near.def && near.def.name || 'NPC');
            lbl.innerHTML = `&#x25CF;&nbsp;${name} ansprechen`;
          }
        } else {
          prompt.classList.add('hidden');
        }
      }

      try { World.update(delta); } catch(e) {}

      try {
        if (typeof City !== 'undefined') {
          const cityEvent = City.update(delta, Player.getPosition());
          if (cityEvent && cityEvent.entered) handleBuildingEnter(cityEvent.entered);
        }
      } catch(e) {}

      try {
        if (typeof AI !== 'undefined') {
          AI.update(delta, S.timeOfDay, Player.getPosition());
          if (!nearbyNPC) {
            const aiNPC = AI.getNearbyNPC(Player.getPosition(), 2.2);
            if (aiNPC) nearbyNPC = { isCitizen: true, citizen: aiNPC, storyChapter: 0, def: null };
          }
        }
      } catch(e) {}

      try { if (typeof SecretLab !== 'undefined') SecretLab.update(delta, Player.getPosition()); } catch(e) {}

      try {
        if (typeof GameAudio !== 'undefined') {
          const moving = !!(playerState && playerState.isMoving);
          GameAudio.update(delta, moving);
        }
      } catch(e) {}

      // Kitchen / counter proximity prompts
      try { checkCookingProximity(); } catch(e) {}

      // Always render — even if updates failed
      renderer.render(scene, camera);

      // Update HUD
      updateHUD3D();
    }
    loop();

    // Interact button
    const btnInteract = document.getElementById('btn-interact');
    if (btnInteract) {
      btnInteract.addEventListener('click', handleInteract);
    }

    // Init city, AI, lab and dialogue if available
    if (typeof City !== 'undefined') City.init(scene, World.colliders);
    if (typeof AI !== 'undefined') AI.init(scene, World.ROOM, City && City.LOCATIONS ? City.LOCATIONS : {});
    if (typeof SecretLab !== 'undefined') {
      SecretLab.init(scene, World.colliders, World.ROOM);
      if (S.storyFlags && S.storyFlags.lab_unlocked) SecretLab.unlock(scene);
    }
    if (typeof Dialogue !== 'undefined') {
      Dialogue.init();
      Dialogue.setOnClose(() => { if (gameLoopRunning && worldInitialized) { canvas3D_show(); touchControls_show(); } });
    }
    if (typeof GameAudio !== 'undefined') GameAudio.init();
  }

  // -------- GAME LOOP (2D fallback) --------
  function startGameLoop2D() {
    worldInitialized = false;
    gameLoopRunning = true;
    showScreen('screen-game');
    refillOrders();
    updateHUD2D();
    Story.init();
    if (S.day === 1 && !S.storyFlags.intro_done) {
      S.storyFlags.intro_done = true;
      save();
      Story.playChapter('intro', () => showScreen('screen-game'));
    }
  }

  function canvas3D_show() {
    document.getElementById('game-canvas').style.display = 'block';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  }

  function touchControls_show() {
    const tc = document.getElementById('touch-controls');
    if (tc) { tc.classList.remove('hidden'); tc.classList.add('active'); }
  }

  function touchControls_hide() {
    const tc = document.getElementById('touch-controls');
    if (tc) { tc.classList.remove('active'); tc.classList.add('hidden'); }
  }

  // Map numeric storyChapter → Story chapter ID
  const CHAPTER_MAP = { 3: 'gang_intro', 6: 'police_intro' };
  const NAME_TO_ID  = { 'Nonna':'nonna', 'Marco':'marco', 'Officer Bauer':'bauer', 'Rosa':'rosa' };

  // -------- BUILDING ENTER --------
  function handleBuildingEnter(buildingId) {
    const labels = {
      frischmarkt: '🛒 Frischmarkt – Zutaten kaufen',
      baumarkt: '🔨 Baumarkt – Upgrades kaufen',
      la_famiglia: '🍷 La Famiglia Bar',
      police_station: '🚔 Polizeipräsidium',
    };
    if (buildingId === 'frischmarkt' || buildingId === 'baumarkt') {
      showToast(`${labels[buildingId] || buildingId} betreten`);
      openManagement();
      document.querySelectorAll('.mgmt-tab').forEach(b => b.classList.remove('active'));
      const tab = buildingId === 'frischmarkt' ? 'shop' : 'build';
      const activeTab = document.querySelector(`.mgmt-tab[data-tab="${tab}"]`);
      if (activeTab) activeTab.classList.add('active');
      renderManagementTab(tab);
    } else if (buildingId === 'la_famiglia' && S.day >= 3) {
      showToast('La Famiglia Bar – Hier hängt Marcos Crew ab');
    } else if (buildingId === 'police_station') {
      showToast('Polizeipräsidium – Inspektor Bauer arbeitet hier');
    } else {
      showToast(labels[buildingId] || `${buildingId} betreten`);
    }
  }

  // -------- INTERACT --------
  function handleInteract() {
    if (!nearbyNPC) return;
    const npc = nearbyNPC;

    // Citizen NPC → open dialogue overlay
    if (npc.isCitizen && npc.citizen) {
      touchControls_hide();
      if (typeof Dialogue !== 'undefined') {
        Dialogue.open({
          name: npc.citizen.name,
          personality: npc.citizen.personality,
          dialogLines: npc.citizen.dialogLines || ['Hallo.'],
          relationship: 50,
          isGangMember: npc.citizen.isGangMember || false,
          isPolice: npc.citizen.isPolice || false,
        });
      } else {
        showToast(`${npc.citizen.name}: "${(npc.citizen.dialogLines||['Hallo.'])[0]}"`);
        setTimeout(() => { canvas3D_show(); touchControls_show(); }, 1500);
      }
      return;
    }

    const chapterNum = npc.storyChapter || (npc.def && npc.def.storyChapter) || 0;
    const chapterId  = CHAPTER_MAP[chapterNum];
    if (!chapterId) return;
    const npcName   = (npc.def && npc.def.name) || '';
    const storyId   = NAME_TO_ID[npcName] || npcName.toLowerCase();
    S.storyFlags['met_' + storyId] = true;
    npc.isInteractable = false;
    touchControls_hide();
    Story.playChapter(chapterId, () => {
      canvas3D_show();
      touchControls_show();
      NPCs.respawn(S);
    });
  }

  // expose gameState for dialogue.js
  window.gameState = {
    get gangTrust()   { return S ? S.gangTrust : 0; },
    set gangTrust(v)  { if (S) { S.gangTrust = clamp(v, -5, 5); save(); } },
    get policeTrust() { return S ? S.policeTrust : 0; },
    set policeTrust(v){ if (S) { S.policeTrust = clamp(v, -5, 5); save(); } },
    get day()         { return S ? S.day : 1; },
  };

  // -------- HUD 3D --------
  function updateHUD3D() {
    const dayBtn = document.getElementById('btn-hud-day');
    const moneyBtn = document.getElementById('btn-hud-money');
    const starsEl = document.getElementById('hud-stars-3d');
    if (dayBtn)   dayBtn.textContent  = `Tag ${S.day}`;
    if (moneyBtn) moneyBtn.textContent = formatMoney(S.money);
    if (starsEl) {
      starsEl.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const s = document.createElement('span');
        s.className = 'star-3d' + (i <= Math.round(S.reputation) ? ' lit' : '');
        s.textContent = '★';
        starsEl.appendChild(s);
      }
    }
  }

  // -------- HUD 2D (fallback) --------
  function updateHUD2D() {
    const dayEl   = document.getElementById('hud-day');
    const moneyEl = document.getElementById('hud-money');
    if (dayEl)   dayEl.textContent   = `Tag ${S.day}`;
    if (moneyEl) moneyEl.textContent = formatMoney(S.money);
    const starsEl = document.getElementById('hud-stars');
    if (starsEl) {
      starsEl.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const s = document.createElement('span');
        s.className = 'star-icon' + (i <= Math.round(S.reputation) ? ' lit' : '');
        s.textContent = '★';
        starsEl.appendChild(s);
      }
    }
  }

  // -------- MANAGEMENT OVERLAY --------
  function openManagement() {
    touchControls_hide();
    document.getElementById('overlay-management').classList.remove('hidden');
    document.querySelectorAll('.mgmt-tab').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.mgmt-tab').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        activeManagementTab = b.dataset.tab;
        renderManagementTab(activeManagementTab);
      });
    });
    renderManagementTab('service');
  }
  window.Game = window.Game || {};

  function closeManagement() {
    document.getElementById('overlay-management').classList.add('hidden');
    if (gameLoopRunning && worldInitialized) touchControls_show();
  }

  function renderManagementTab(tab) {
    const body = document.getElementById('mgmt-body');
    if (!body) return;
    body.innerHTML = '';
    if (tab === 'service') renderServiceTab(body);
    else if (tab === 'shop') renderShopTab(body);
    else if (tab === 'build') renderBuildTab(body);
    else if (tab === 'office') renderOfficeTab(body);
  }

  // -------- SERVICE TAB --------
  function renderServiceTab(container) {
    let html = `<div class="card">
      <div class="card-title">Aktuelle Bestellungen</div>
      <div class="order-queue">`;
    const active = currentOrders.filter(o => !o.done);
    if (!active.length) {
      html += `<div style="color:var(--c-text3);font-size:13px;text-align:center;padding:14px">Keine Bestellungen…</div>`;
    } else {
      active.forEach(o => {
        html += `<div class="order-item${o.urgent?' urgent':''}">
          <div class="order-pizza-thumb">${pizzaThumb(o.type)}</div>
          <div class="order-info">
            <div class="order-name">${o.name}</div>
            <div class="order-desc">${o.toppings.join(', ')}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            <div class="order-timer${o.urgent?' urgent':''}">${formatMoney(o.price)}</div>
            <button class="btn btn-small btn-gold" onclick="Game.openKitchen('${o.id}')">Zubereiten</button>
          </div>
        </div>`;
      });
    }
    html += `</div></div>`;

    if (S.gangEvent && !S.gangWarningShown && S.day >= 3) {
      const msgs = {
        paid:'Marco erwartet 500 € am Monatsende.',
        refused:'Marco ist sauer. Negative Bewertungen tauchen auf.',
        stall:'Marco wartet auf eine Antwort.',
      };
      html += `<div class="gang-alert">
        <div class="gang-icon">⚠️</div>
        <div>
          <div class="gang-text">${msgs[S.gangEvent]||'Die Russoni-Gruppe beobachtet dich.'}</div>
        </div>
      </div>`;
    }

    const revenue = currentOrders.filter(o=>o.done).reduce((a,o)=>a+o.price,0);
    html += `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div><div class="card-title">Heute Einnahmen</div><div class="card-big-num">${formatMoney(revenue)}</div></div>
        <div style="text-align:right"><div class="card-title">Erledigt</div><div class="card-big-num">${currentOrders.filter(o=>o.done).length}/${currentOrders.length}</div></div>
      </div>
      <button class="btn btn-gold" onclick="Game.endDay()">Tag beenden &amp; kassieren</button>
    </div>`;

    container.innerHTML = html;
  }

  // -------- SHOP TAB --------
  function renderShopTab(container) {
    const insideFrischmarkt = typeof City !== 'undefined' && City.getCurrentBuilding && City.getCurrentBuilding() === 'frischmarkt';
    if (!insideFrischmarkt) {
      container.innerHTML = `<div style="text-align:center;padding:30px 16px"><div style="font-size:40px">🛒</div><div style="font-size:15px;font-weight:700;margin:10px 0;color:var(--c-gold)">Zutaten gibt's nur im Frischmarkt!</div><div style="font-size:13px;color:var(--c-text2);line-height:1.6">Geh raus aus dem Restaurant und folge der Straße ins Dorf. Der Frischmarkt ist das Gebäude mit dem grünen Schild auf der linken Seite.</div></div>`;
      return;
    }
    let html = `<div class="card">
      <div class="card-title">Zutaten kaufen</div>
      <div style="font-size:13px;color:var(--c-text2);margin-bottom:12px">Guthaben: <strong style="color:var(--c-gold)">${formatMoney(S.money)}</strong></div>
      <div class="shop-grid">`;
    SHOP_ITEMS.forEach(item => {
      if (item.requiresRecipe && S.upgrades.recipes < item.requiresRecipe) return;
      const canAfford = S.money >= item.price;
      const stock = S.inventory[item.id] || 0;
      html += `<div class="shop-item">
        <div class="shop-icon">${IngredientIcons[item.id]||''}</div>
        <div class="shop-info">
          <div class="shop-name">${item.name}</div>
          <div class="shop-desc">Vorrat: ${stock} | ${item.desc}</div>
          <div class="shop-price">${formatMoney(item.price)}</div>
        </div>
        <button class="shop-buy${canAfford?'':' disabled'}" onclick="Game.buyIngredient('${item.id}')">Kaufen</button>
      </div>`;
    });
    html += `</div></div>`;
    container.innerHTML = html;
  }

  // -------- BUILD TAB --------
  function renderBuildTab(container) {
    const insideBaumarkt = typeof City !== 'undefined' && City.getCurrentBuilding && City.getCurrentBuilding() === 'baumarkt';
    if (!insideBaumarkt) {
      container.innerHTML = `<div style="text-align:center;padding:30px 16px"><div style="font-size:40px">🔨</div><div style="font-size:15px;font-weight:700;margin:10px 0;color:var(--c-gold)">Umbauten kauft man im Baumarkt!</div><div style="font-size:13px;color:var(--c-text2);line-height:1.6">Das Gebäude mit dem orangen Schild rechts im Dorf.</div></div>`;
      return;
    }
    let html = `<div class="card"><div class="card-title">Renovierung &amp; Upgrades</div><div class="build-grid">`;
    Object.keys(UPGRADES).forEach(key => {
      const upg = UPGRADES[key];
      const lvl = S.upgrades[key];
      const maxed = lvl >= upg.maxLevel;
      const nextCost = maxed ? 0 : upg.costs[lvl];
      const canAfford = !maxed && S.money >= nextCost;
      const cls = `build-card${maxed?' maxed':''}${!maxed&&!canAfford?' locked':''}`;
      html += `<div class="${cls}" onclick="Game.upgrade('${key}')">
        <div class="build-icon">${buildIcon(key)}</div>
        <div class="build-name">${upg.name}</div>
        <div class="build-level">${upg.desc[lvl-1]||upg.desc[0]} (Stufe ${lvl}/${upg.maxLevel})</div>
        <div class="build-cost${maxed?' maxed':''}">${maxed?'✓ Max':formatMoney(nextCost)}</div>
        <div style="font-size:10px;color:var(--c-text3)">${upg.benefit}</div>
      </div>`;
    });
    html += `</div></div>`;
    container.innerHTML = html;
  }

  // -------- OFFICE TAB --------
  function renderOfficeTab(container) {
    let html = `<div class="office-section"><div class="office-section-title">Personal</div><div class="staff-grid">`;
    STAFF_LIST.forEach(staff => {
      if (staff.requiresUpgrade && !S.upgrades[staff.requiresUpgrade]) return;
      const hired = S.staff[staff.id];
      const portrait = Portraits[staff.portrait] ? Portraits[staff.portrait]() : Portraits.unknown();
      html += `<div class="staff-card">
        <div class="staff-portrait">${portrait}</div>
        <div class="staff-name">${staff.name}</div>
        <div class="staff-role">${staff.role}</div>
        <div class="staff-cost">${formatMoney(staff.costPerDay)}/Tag</div>
        ${hired
          ? `<div class="staff-hired">✓ Angestellt</div>`
          : `<button class="staff-hire" onclick="Game.hireStaff('${staff.id}')">Einstellen</button>`}
      </div>`;
    });
    html += `</div></div>`;

    const dailyStaffCost = STAFF_LIST.filter(s => S.staff[s.id]).reduce((a,s) => a+s.costPerDay, 0);
    const revenue = currentOrders.filter(o=>o.done).reduce((a,o)=>a+o.price, 0);
    html += `<div class="office-section"><div class="office-section-title">Finanzen</div>
    <div class="card">
      <div class="income-row"><span>Heute Einnahmen</span><span class="income-pos">+${formatMoney(revenue)}</span></div>
      <div class="income-row"><span>Ausgaben (Zutaten)</span><span class="income-neg">-${formatMoney(S.todayExpenses)}</span></div>
      <div class="income-row"><span>Personal (tägl.)</span><span class="income-neg">-${formatMoney(dailyStaffCost)}</span></div>
      ${S.gangEvent==='paid'?`<div class="income-row"><span style="color:#D44040">Schutzgeld (monatl.)</span><span class="income-neg">-500 €</span></div>`:''}
      <div class="income-row"><span>Kontostand</span><span class="income-pos">${formatMoney(S.money)}</span></div>
    </div></div>`;

    html += `<div class="office-section"><div class="office-section-title">Fortschritt</div>
    <div class="card">
      <div class="income-row"><span>Pizzen gebacken</span><span>${S.stats.pizzasMade}</span></div>
      <div class="income-row"><span>Kunden bedient</span><span>${S.stats.customersServed}</span></div>
      <div class="income-row"><span>Gesamteinnahmen</span><span class="income-pos">${formatMoney(S.stats.totalEarned)}</span></div>
      <div class="income-row"><span>Ruf</span><span>${'★'.repeat(Math.round(S.reputation))}${'☆'.repeat(5-Math.round(S.reputation))}</span></div>
      <div class="income-row"><span>Moral</span><span style="color:${S.morality>0?'var(--c-green)':S.morality<0?'var(--c-red)':'var(--c-text2)'}">${S.morality>3?'Ehrenhaft':S.morality<-3?'Kriminell':'Grauzone'}</span></div>
    </div></div>`;

    container.innerHTML = html;
  }

  // -------- KITCHEN --------
  function openKitchen(orderId) {
    const order = currentOrders.find(o => String(o.id) === String(orderId));
    if (!order || order.done) return;
    kitchenOrder = order;
    kitchenToppings = [];
    closeManagement();
    document.getElementById('overlay-kitchen').classList.remove('hidden');
    renderKitchen();
  }

  function renderKitchen() {
    document.getElementById('kitchen-order').innerHTML =
      `Bestellung: <strong>${kitchenOrder.name}</strong> – ${formatMoney(kitchenOrder.price)}<br>
       <span style="font-size:12px;color:var(--c-text3)">Benötigt: ${kitchenOrder.toppings.join(', ')}</span>`;
    document.getElementById('kitchen-pizza').innerHTML = buildPizzaSVG(kitchenToppings, 160);
    const available = Object.keys(S.inventory).filter(k=>k!=='dough');
    let chips = '';
    available.forEach(ing => {
      const stock = S.inventory[ing];
      const active = kitchenToppings.includes(ing) ? ' active' : '';
      const icon = IngredientIcons[ing] || '';
      chips += `<div class="topping-chip${active}" onclick="Game.toggleTopping('${ing}')">
        ${icon}<span>${ing}</span><span style="font-size:10px;color:var(--c-gold)">${stock}</span>
      </div>`;
    });
    document.getElementById('kitchen-ingredients').innerHTML = chips;
  }

  function toggleTopping(ing) {
    if (S.inventory[ing] <= 0 && !kitchenToppings.includes(ing)) { showToast('Nicht genug ' + ing + '!'); return; }
    const idx = kitchenToppings.indexOf(ing);
    if (idx >= 0) kitchenToppings.splice(idx, 1);
    else kitchenToppings.push(ing);
    renderKitchen();
  }

  function bake() {
    if (!kitchenOrder) return;
    if (S.inventory.dough <= 0) { showToast('Kein Teig!'); return; }
    S.inventory.dough--;
    kitchenToppings.forEach(t => { if (S.inventory[t] > 0) S.inventory[t]--; });
    const required = kitchenOrder.toppings;
    const matched = required.filter(r => kitchenToppings.includes(r)).length;
    const extra = kitchenToppings.filter(t => !required.includes(t)).length;
    const quality = matched / required.length;
    let bonus = 0;
    if (typeof GameAudio !== 'undefined') GameAudio.playPizzaBake();
    if (quality === 1 && extra === 0) { bonus = 2; showToast('🍕 Perfekte Pizza! +2€'); }
    else if (quality >= 0.6) showToast('Gute Pizza!');
    else { bonus = -2; showToast('Pizza nicht ganz richtig…'); }
    kitchenOrder.done = true;
    kitchenOrder.price += bonus;
    S.stats.pizzasMade++;
    S.repPoints += quality>=1?3:quality>=0.6?1:0;
    if (S.repPoints >= 10 + S.reputation * 6) { S.repPoints=0; S.reputation=Math.min(S.reputation+0.5,5); }
    closeKitchen();
    openManagement();
    renderManagementTab('service');
    updateHUD3D();
    save();
  }

  function closeKitchen() {
    document.getElementById('overlay-kitchen').classList.add('hidden');
    kitchenOrder = null;
    kitchenToppings = [];
  }

  // -------- SHOP / BUILD / STAFF --------
  function buyIngredient(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    if (S.money < item.price) { showToast('Nicht genug Geld!'); return; }
    S.money -= item.price;
    S.inventory[id] = (S.inventory[id]||0) + item.qty;
    S.todayExpenses += item.price;
    showToast(`${item.name} gekauft (+${item.qty})`);
    updateHUD3D();
    renderManagementTab('shop');
    save();
  }

  function upgrade(key) {
    const upg = UPGRADES[key];
    const lvl = S.upgrades[key];
    if (lvl >= upg.maxLevel) { showToast('Bereits maximiert!'); return; }
    const cost = upg.costs[lvl];
    if (S.money < cost) { showToast('Nicht genug Geld!'); if (typeof GameAudio !== 'undefined') GameAudio.playError(); return; }
    S.money -= cost;
    S.upgrades[key]++;
    showToast(`${upg.name} → Stufe ${S.upgrades[key]}!`);
    if (typeof GameAudio !== 'undefined') GameAudio.playSuccess();
    updateHUD3D();
    renderManagementTab('build');
    save();
  }

  function hireStaff(id) {
    S.staff[id] = true;
    showToast('Personal eingestellt!');
    renderManagementTab('office');
    save();
  }

  // -------- DAY END --------
  function endDay() {
    const revenue = currentOrders.filter(o=>o.done).reduce((a,o)=>a+o.price,0);
    const staffCost = STAFF_LIST.filter(s=>S.staff[s.id]).reduce((a,s)=>a+s.costPerDay,0);
    S.money += revenue - staffCost;
    S.stats.totalEarned += revenue;
    S.stats.customersServed += currentOrders.filter(o=>o.done).length;
    S.todayRevenue = revenue;
    S.todayExpenses += staffCost;
    if (S.gangEvent==='paid' && S.day % 30 === 0) { S.money -= 500; showToast('500€ Schutzgeld abgezogen.'); }
    document.getElementById('overlay-management').classList.add('hidden');
    if (typeof GameAudio !== 'undefined') GameAudio.playDayEnd();
    showSummary(revenue, staffCost);
  }

  function showSummary(revenue, staffCost) {
    const profit = revenue - staffCost - S.todayExpenses;
    const completed = currentOrders.filter(o=>o.done).length;
    let eventHtml = '';
    if (S.day === 3 && !S.storyFlags.gang_intro_triggered) {
      eventHtml = `<div class="summary-event" style="border-color:rgba(139,26,46,.5);background:rgba(80,8,12,.3)">
        <strong style="color:#D44040">⚠️ Abends am Laden…</strong><br>Drei Männer stehen vor der Tür. Ihr Anführer legt einen Umschlag auf die Theke.
      </div>`;
    }
    if (S.day === 6 && S.gangEvent && !S.storyFlags.police_intro_triggered) {
      eventHtml += `<div class="summary-event" style="border-color:rgba(45,111,164,.5);background:rgba(12,30,60,.3)">
        <strong style="color:#4A8AE8">🚔 Unbekannter Besucher…</strong><br>Ein Mann in Uniform fragt nach deinem Onkel. Er kennt Namen, die du nicht kennst.
      </div>`;
    }
    if (S.day >= 14 && !S.finalDecisionUnlocked && S.gangEvent && S.policeEvent) {
      S.finalDecisionUnlocked = true;
      eventHtml += `<div class="summary-event" style="border-color:rgba(245,197,66,.35);background:rgba(40,30,5,.5)">
        <strong style="color:var(--c-gold)">💬 Die Zeit läuft ab…</strong><br>Beide Seiten warten auf eine Entscheidung. Es gibt kein weiteres Zögern.
      </div>`;
    }
    const ov = document.getElementById('overlay-summary');
    const panel = document.getElementById('summary-panel');
    ov.classList.remove('hidden');
    panel.innerHTML = `
      <div class="summary-icon">${profit>=0?'📈':'📉'}</div>
      <div class="summary-title">Tag ${S.day} beendet</div>
      <div class="summary-day">PIZZA EMPIRE</div>
      <div class="summary-stats">
        <div class="summary-stat"><span>Bestellungen</span><span>${completed}/${currentOrders.length}</span></div>
        <div class="summary-stat"><span>Einnahmen</span><span class="income-pos">+${formatMoney(revenue)}</span></div>
        <div class="summary-stat"><span>Ausgaben</span><span class="income-neg">-${formatMoney(staffCost+S.todayExpenses)}</span></div>
        <div class="summary-stat"><span>Gewinn</span><span style="color:${profit>=0?'var(--c-green)':'var(--c-red)'}">${profit>=0?'+':''}${formatMoney(profit)}</span></div>
        <div class="summary-stat"><span>Kontostand</span><span>${formatMoney(S.money)}</span></div>
      </div>
      ${eventHtml}
      <button class="btn btn-gold" style="width:88%;max-width:340px" onclick="Game.nextDay()">Nächster Tag →</button>
    `;
  }

  function nextDay() {
    S.day++;
    if (typeof GameAudio !== 'undefined' && GameAudio.nextTrack) { try { GameAudio.nextTrack(); } catch(e) {} }
    if (typeof World !== 'undefined' && World.setSkyVariant) { try { World.setSkyVariant(S.day); } catch(e) {} }
    S.todayExpenses = 0;
    S.todayRevenue = 0;
    currentOrders = [];
    document.getElementById('overlay-summary').classList.add('hidden');

    // Story triggers – NPCs in 3D world appear
    if (S.day === 3 && !S.storyFlags.gang_intro_triggered) {
      S.storyFlags.gang_intro_triggered = true;
      save();
      touchControls_hide();
      if (worldInitialized) NPCs.respawn(S);
      Story.playChapter('gang_intro', () => { canvas3D_show(); touchControls_show(); });
      return;
    }
    if (S.day === 6 && S.gangEvent && !S.storyFlags.police_intro_triggered) {
      S.storyFlags.police_intro_triggered = true;
      save();
      touchControls_hide();
      if (worldInitialized) NPCs.respawn(S);
      Story.playChapter('police_intro', () => { canvas3D_show(); touchControls_show(); });
      return;
    }
    // Gang mission chain
    if (S.day === 5 && S.gangEvent === 'paid' && !S.storyFlags.gang_m1_triggered) {
      S.storyFlags.gang_m1_triggered = true; save();
      touchControls_hide();
      Story.playChapter('gang_mission_1', () => { canvas3D_show(); touchControls_show(); });
      return;
    }
    if (S.day === 8 && S.gangEvent === 'mission1_done' && !S.storyFlags.gang_m2_triggered) {
      S.storyFlags.gang_m2_triggered = true; save();
      touchControls_hide();
      Story.playChapter('gang_mission_2', () => { canvas3D_show(); touchControls_show();
        if (typeof SecretLab !== 'undefined') SecretLab.unlock(World.scene);
        showToast('🔓 Geheimkeller freigeschaltet! Büro → hinter dem Aktenschrank.');
      });
      return;
    }
    if (S.day === 11 && (S.gangEvent === 'lab_revealed' || S.gangEvent === 'mission1_done') && !S.storyFlags.gang_m3_triggered) {
      S.storyFlags.gang_m3_triggered = true; save();
      touchControls_hide();
      Story.playChapter('gang_mission_3', () => { canvas3D_show(); touchControls_show(); });
      return;
    }
    // Police informant chain
    if (S.day === 8 && S.policeEvent === 'info' && !S.storyFlags.police_m1_triggered) {
      S.storyFlags.police_m1_triggered = true; save();
      touchControls_hide();
      Story.playChapter('police_mission_1', () => { canvas3D_show(); touchControls_show(); });
      return;
    }
    // Fritz (old man) – day 4 in park
    if (S.day === 4 && !S.storyFlags.fritz_met) {
      S.storyFlags.fritz_met = true; save();
      touchControls_hide();
      Story.playChapter('fritz_secret', () => { canvas3D_show(); touchControls_show();
        showToast('🔑 Schlüssel gefunden! Was öffnet er?');
      });
      return;
    }
    // Romano (big boss) – day 15 for gang path
    if (S.day === 15 && (S.gangEvent === 'official_member' || S.gangEvent === 'lab_revealed') && !S.storyFlags.romano_triggered) {
      S.storyFlags.romano_triggered = true; save();
      touchControls_hide();
      Story.playChapter('romano_intro', () => { canvas3D_show(); touchControls_show(); });
      return;
    }
    if (S.day >= 14 && S.finalDecisionUnlocked && !S.storyFlags.final_done && !S.storyFlags.romano_triggered) {
      S.storyFlags.final_done = true;
      save();
      touchControls_hide();
      Story.playChapter('final_decision', () => { canvas3D_show(); touchControls_show(); });
      return;
    }

    // Passive lab income
    if (typeof SecretLab !== 'undefined' && SecretLab.isUnlocked()) {
      SecretLab.triggerDayTick && SecretLab.triggerDayTick();
      const labState = SecretLab.getState ? SecretLab.getState() : {};
      const labIncome = labState.moneyReady ? 50 * (labState.printerUpgraded ? 2 : 1) : 0;
      if (labIncome > 0 && labState.moneyReady) { /* cleared in doAction */ }
      if (labIncome > 0) { S.money += labIncome; showToast(`💰 Labor-Einnahmen: +${labIncome}€`); }
    }

    if (S.money < 0) { S.money = 0; showToast('Achtung: Geld aufgebraucht!'); }
    if (worldInitialized) { NPCs.respawn(S); }
    refillOrders();
    updateHUD3D();
    save();
    if (gameLoopRunning && worldInitialized) { canvas3D_show(); touchControls_show(); }
  }

  // -------- GAME SCREEN (2D fallback only) --------
  function showGameScreen() {
    if (worldInitialized) { canvas3D_show(); touchControls_show(); }
    else showScreen('screen-game');
    refillOrders();
    updateHUD3D();
    save();
  }

  // -------- ENDINGS --------
  function triggerEnding(type) {
    const msgs = {
      honest: { title:'Ende: Restaurant-König 👑',  text:'Ehrlich, hart erarbeitet. Ein echtes Stück Neapel in der Stadt.',         color:'var(--c-green)' },
      gang:   { title:'Ende: Gang übernimmt 😬',    text:'Der Laden läuft – aber nicht mehr für dich. Willkommen im Kartell.',      color:'#D44040'        },
      police: { title:'Ende: Polizei deckt auf 🚔', text:'Marco ist hinter Gittern. Der Laden gehört dir – sauber und frei.',       color:'#4A8AE8'        },
      empire: { title:'Ende: Weltreich 🌍',          text:'Berlin. Wien. Zürich. Du hast alle überlistet. Pizza Empire weltweit.',   color:'var(--c-gold)'  },
    };
    const m = msgs[type] || msgs.honest;
    const ov = document.getElementById('overlay-summary');
    const panel = document.getElementById('summary-panel');
    ov.classList.remove('hidden');
    touchControls_hide();
    panel.innerHTML = `
      <div style="font-size:60px;margin-bottom:10px">🍕</div>
      <div style="font-size:26px;font-weight:700;font-family:Georgia,serif;color:${m.color};text-align:center;margin-bottom:12px">${m.title}</div>
      <div style="font-size:15px;color:var(--c-text);text-align:center;line-height:1.7;max-width:300px;margin-bottom:20px">${m.text}</div>
      <div class="summary-stats" style="width:88%;max-width:340px">
        <div class="summary-stat"><span>Pizzen gebacken</span><span>${S.stats.pizzasMade}</span></div>
        <div class="summary-stat"><span>Tage gespielt</span><span>${S.day}</span></div>
        <div class="summary-stat"><span>Gesamteinnahmen</span><span class="income-pos">${formatMoney(S.stats.totalEarned)}</span></div>
      </div>
      <button class="btn btn-outline" style="width:88%;max-width:340px;margin-top:16px" onclick="Game.restartGame()">Neu starten</button>
    `;
  }

  function restartGame() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    gameLoopRunning = false;
    worldInitialized = false;
    localStorage.removeItem(SAVE_KEY);
    document.getElementById('overlay-summary').classList.add('hidden');
    touchControls_hide();
    showTitleScreen();
  }

  // -------- TITLE SCREEN --------
  function showTitleScreen() {
    showScreen('screen-title');
    document.getElementById('game-canvas').style.display = 'none';
    const hasSaved = hasSave();
    const btnC = document.getElementById('btn-continue');
    const info = document.getElementById('title-save-info');
    if (hasSaved) {
      const sv = load();
      btnC.classList.remove('hidden');
      info.classList.remove('hidden');
      info.textContent = `Letzter Spielstand: Tag ${sv.day} · ${formatMoney(sv.money)}`;
    } else {
      btnC.classList.add('hidden');
      info.classList.add('hidden');
    }
    const pEl = document.getElementById('title-pizza');
    if (pEl) pEl.innerHTML = buildPizzaSVG(['sauce','cheese','salami','basil','peppers'], 180);
  }

  // -------- HELPERS --------
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    }
  }

  // -------- BUILD ICONS --------
  function buildIcon(key) {
    const icons = {
      oven:     `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="10" width="44" height="36" rx="6" fill="#2E2820" stroke="#F5C542" stroke-width="1.5"/><rect x="10" y="18" width="32" height="22" rx="4" fill="#1a1208" stroke="#C87A20" stroke-width="1.2"/><circle cx="15" cy="14" r="2.5" fill="#F5C542"/><circle cx="26" cy="14" r="2.5" fill="#F5C542"/><circle cx="37" cy="14" r="2.5" fill="#C73E1D"/><path d="M15 28 Q26 23 37 28" stroke="#C73E1D" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
      decor:    `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="30" width="14" height="18" rx="2" fill="#2E2820" stroke="#F5C542" stroke-width="1.2"/><rect x="22" y="20" width="10" height="28" rx="2" fill="#2E2820" stroke="#F5C542" stroke-width="1.2"/><rect x="34" y="25" width="14" height="23" rx="2" fill="#2E2820" stroke="#F5C542" stroke-width="1.2"/><path d="M4 48 L48 48" stroke="#C87A20" stroke-width="2" stroke-linecap="round"/></svg>`,
      dining:   `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="18" width="32" height="20" rx="3" fill="#2E2820" stroke="#F5C542" stroke-width="1.2"/><rect x="4" y="38" width="10" height="10" rx="2" fill="#241F1A" stroke="#C87A20" stroke-width="1"/><rect x="38" y="38" width="10" height="10" rx="2" fill="#241F1A" stroke="#C87A20" stroke-width="1"/><circle cx="26" cy="28" r="5" fill="#C73E1D" opacity=".6"/></svg>`,
      recipes:  `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="6" width="30" height="40" rx="4" fill="#2E2820" stroke="#F5C542" stroke-width="1.2"/><path d="M16 16 L36 16 M16 22 L36 22 M16 28 L28 28" stroke="#C87A20" stroke-width="1.5" stroke-linecap="round"/><circle cx="32" cy="36" r="7" fill="#C73E1D" opacity=".7"/></svg>`,
      signage:  `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="40" height="26" rx="5" fill="#1a1208" stroke="#F5C542" stroke-width="1.8"/><text x="26" y="25" font-size="14" font-weight="bold" fill="#F5C542" text-anchor="middle" font-family="Georgia,serif">PIZZA</text><path d="M26 32 L26 46" stroke="#C87A20" stroke-width="2.5" stroke-linecap="round"/></svg>`,
      delivery: `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 34 L8 22 L28 16 L44 22 L44 34" stroke="#F5C542" stroke-width="1.5" fill="none" stroke-linejoin="round"/><rect x="6" y="34" width="40" height="8" rx="2" fill="#2E2820" stroke="#C87A20" stroke-width="1.2"/><circle cx="16" cy="43" r="4" fill="#1a1208" stroke="#F5C542" stroke-width="1.5"/><circle cx="36" cy="43" r="4" fill="#1a1208" stroke="#F5C542" stroke-width="1.5"/></svg>`,
    };
    return icons[key] || '';
  }

  // -------- PAUSE MENU --------
  function openPause() {
    touchControls_hide();
    document.getElementById('overlay-pause').classList.remove('hidden');
  }
  function closePause() {
    document.getElementById('overlay-pause').classList.add('hidden');
    if (gameLoopRunning && worldInitialized) touchControls_show();
  }
  function exitToMenu() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    gameLoopRunning = false;
    worldInitialized = false;
    cookingActive = false;
    ['overlay-pause','overlay-cooking','overlay-kitchen','overlay-management','overlay-summary']
      .forEach(id => document.getElementById(id).classList.add('hidden'));
    touchControls_hide();
    save();
    showTitleScreen();
  }

  // -------- COOKING PROXIMITY CHECK (called every frame) --------
  function checkCookingProximity() {
    if (!worldInitialized || cookingActive) {
      ['kitchen-prompt','counter-prompt'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
      return;
    }
    const pp = Player.getPosition();
    const kd = Math.hypot(pp.x - KITCHEN_POS.x, pp.z - KITCHEN_POS.z);
    const cd = Math.hypot(pp.x - COUNTER_POS.x, pp.z - COUNTER_POS.z);
    const kp = document.getElementById('kitchen-prompt');
    const cp = document.getElementById('counter-prompt');
    if (kp) kp.classList.toggle('hidden', kd >= PROX_RADIUS);
    if (cp) cp.classList.toggle('hidden', cd >= PROX_RADIUS);
  }

  // -------- 3D COOKING (Schedule One style) --------
  function openCooking3D() {
    const order = currentOrders.find(o => !o.done);
    if (!order) {
      showToast('Keine offene Bestellung vorhanden!');
      return;
    }
    cookingOrderId  = order.id;
    cookingStep     = 0;
    cookingToppings = [];
    cookingActive   = true;
    touchControls_hide();
    document.getElementById('overlay-cooking').classList.remove('hidden');

    const infoEl = document.getElementById('ck-order-info');
    if (infoEl) infoEl.innerHTML =
      `<strong>${order.name}</strong> &mdash; ${order.toppings.filter(t=>t!=='dough').join(', ')} &mdash; ${formatMoney(order.price)}`;

    _startCookStep(0);
  }

  function closeCooking3D() {
    cookingActive = false;
    document.getElementById('overlay-cooking').classList.add('hidden');
    if (gameLoopRunning && worldInitialized) { canvas3D_show(); touchControls_show(); }
    save();
    updateHUD3D();
  }

  function _startCookStep(step) {
    cookingStep = step;
    const visuals  = ['ck-dough','ck-sauce','ck-toppings-visual','ck-oven-wrap','ck-baking-vis','ck-result-vis'];
    const ctrls    = ['ck-ctrl-dough','ck-ctrl-sauce','ck-ctrl-toppings','ck-ctrl-oven','ck-ctrl-baking','ck-ctrl-result'];
    visuals.forEach((id,i) => { const el = document.getElementById(id); if (el) el.classList.toggle('hidden', i!==step); });
    ctrls.forEach((id,i)   => { const el = document.getElementById(id); if (el) el.classList.toggle('hidden', i!==step); });
    document.querySelectorAll('.ck-step').forEach((el,i) => {
      el.classList.toggle('active', i === step);
      el.classList.toggle('done', i < step);
    });
    if (step === 0) _initDough();
    else if (step === 1) _initSauce();
    else if (step === 2) _initToppings();
    else if (step === 3) _initOven();
    else if (step === 4) _startBaking();
    else if (step === 5) _showResult();
  }

  // ---- STEP 0: DOUGH ----
  function _initDough() {
    doughTapCount = 0;
    const circle = document.getElementById('ck-dough-circle');
    const bar    = document.getElementById('dough-bar');
    const cnt    = document.getElementById('dough-count');
    if (circle) circle.style.cssText = 'width:120px;height:120px';
    if (bar) bar.style.width = '0%';
    if (cnt) cnt.textContent = '0 / ' + DOUGH_TAPS;
  }

  function onDoughTap() {
    if (cookingStep !== 0) return;
    doughTapCount++;
    const pct    = Math.min(doughTapCount / DOUGH_TAPS, 1);
    const sz     = Math.round(120 + pct * 60);
    const circle = document.getElementById('ck-dough-circle');
    const bar    = document.getElementById('dough-bar');
    const cnt    = document.getElementById('dough-count');
    if (circle) {
      circle.style.width  = sz + 'px';
      circle.style.height = sz + 'px';
      circle.classList.remove('dough-tap');
      void circle.offsetWidth; // force reflow
      circle.classList.add('dough-tap');
    }
    if (bar)  bar.style.width = (pct * 100) + '%';
    if (cnt)  cnt.textContent = doughTapCount + ' / ' + DOUGH_TAPS;
    if (doughTapCount >= DOUGH_TAPS) {
      const c = document.getElementById('ck-dough-circle');
      if (c) c.onclick = null;
      setTimeout(() => _startCookStep(1), 350);
    }
  }

  // ---- STEP 1: SAUCE ----
  function _initSauce() {
    const canvas = document.getElementById('sauce-canvas');
    if (!canvas) { _startCookStep(2); return; }
    const ctx  = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const CX = W/2, CY = H/2, R = W * 0.43;

    ctx.clearRect(0, 0, W, H);
    // crust
    ctx.beginPath(); ctx.arc(CX, CY, R+7, 0, Math.PI*2);
    ctx.fillStyle = '#D4A055'; ctx.fill();
    // base
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2);
    ctx.fillStyle = '#F0C878'; ctx.fill();

    // tracking canvas for coverage
    const track = document.createElement('canvas');
    track.width = W; track.height = H;
    const tCtx = track.getContext('2d');
    let painting = false;
    let done = false;

    function paint(x, y) {
      if (done) return;
      if ((x-CX)**2 + (y-CY)**2 > R*R) return;
      ctx.save();
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2); ctx.clip();
      ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(175,35,15,.78)'; ctx.fill();
      ctx.restore();
      tCtx.beginPath(); tCtx.arc(x, y, 22, 0, Math.PI*2);
      tCtx.fillStyle = '#fff'; tCtx.fill();
      // measure coverage via sampling
      let hit = 0, tot = 0;
      const step = 10;
      for (let px = CX-R; px <= CX+R; px+=step) {
        for (let py = CY-R; py <= CY+R; py+=step) {
          if ((px-CX)**2+(py-CY)**2 <= R*R) {
            tot++;
            if (tCtx.getImageData(px|0, py|0, 1, 1).data[0] > 128) hit++;
          }
        }
      }
      const cov = tot > 0 ? hit/tot : 0;
      const sBar = document.getElementById('sauce-bar');
      if (sBar) sBar.style.width = Math.min(cov*150, 100)+'%';
      if (cov > 0.58) {
        done = true;
        canvas.removeEventListener('touchstart', onTS, {passive:false});
        canvas.removeEventListener('touchmove',  onTM, {passive:false});
        canvas.removeEventListener('mousedown',  onMD);
        canvas.removeEventListener('mousemove',  onMM);
        setTimeout(() => _startCookStep(2), 450);
      }
    }

    function pos(e, touch) {
      const r = canvas.getBoundingClientRect();
      const p = touch ? e.touches[0] : e;
      return { x:(p.clientX-r.left)*(W/r.width), y:(p.clientY-r.top)*(H/r.height) };
    }
    function onTS(e) { e.preventDefault(); painting=true; const p=pos(e,true); paint(p.x,p.y); }
    function onTM(e) { e.preventDefault(); if(!painting)return; const p=pos(e,true); paint(p.x,p.y); }
    function onMD(e) { painting=true; const p=pos(e,false); paint(p.x,p.y); }
    function onMM(e) { if(!painting)return; const p=pos(e,false); paint(p.x,p.y); }
    canvas.addEventListener('touchstart', onTS, {passive:false});
    canvas.addEventListener('touchmove',  onTM, {passive:false});
    canvas.addEventListener('touchend',   () => { painting=false; }, {passive:false});
    canvas.addEventListener('mousedown',  onMD);
    canvas.addEventListener('mousemove',  onMM);
    canvas.addEventListener('mouseup',    () => { painting=false; });
  }

  // ---- STEP 2: TOPPINGS ----
  function _initToppings() {
    cookingToppings = [];
    const order  = currentOrders.find(o => String(o.id) === String(cookingOrderId));
    const canvas = document.getElementById('toppings-canvas');
    if (!canvas || !order) { _startCookStep(3); return; }
    const ctx  = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const CX = W/2, CY = H/2, R = W*0.43;

    const COLORS = { salami:'#8B1A1A', mushrooms:'#8B7355', peppers:'#C73E1D',
                     olives:'#2D4A1E', basil:'#2E7D32', pineapple:'#FFB300',
                     cheese:'rgba(240,190,50,.8)' };

    function redraw() {
      ctx.clearRect(0,0,W,H);
      // crust
      ctx.beginPath(); ctx.arc(CX,CY,R+7,0,Math.PI*2); ctx.fillStyle='#D4A055'; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(CX,CY,R,0,Math.PI*2); ctx.clip();
      // sauce
      ctx.fillStyle='#B52214'; ctx.fill();
      // cheese if added
      if (cookingToppings.includes('cheese')) {
        ctx.beginPath(); ctx.arc(CX,CY,R,0,Math.PI*2);
        ctx.fillStyle='rgba(240,200,60,.65)'; ctx.fill();
      }
      // other toppings as blobs
      const placed = cookingToppings.filter(t=>t!=='sauce'&&t!=='cheese'&&t!=='dough');
      placed.forEach((t,i) => {
        const angle = (i/Math.max(placed.length,1))*Math.PI*2 + 0.4;
        const d = R*0.48;
        const tx = CX+Math.cos(angle)*d, ty = CY+Math.sin(angle)*d;
        ctx.beginPath(); ctx.arc(tx,ty,13,0,Math.PI*2);
        ctx.fillStyle = COLORS[t]||'#888'; ctx.fill();
        // extra blobs spread around
        for (let j=1;j<3;j++) {
          const a2=angle+j*1.2, d2=R*(0.2+j*0.15);
          ctx.beginPath(); ctx.arc(CX+Math.cos(a2)*d2,CY+Math.sin(a2)*d2,9,0,Math.PI*2);
          ctx.fillStyle=COLORS[t]||'#888'; ctx.fill();
        }
      });
      ctx.restore();
      _cookRedraw = redraw;
    }
    redraw();

    const chips = document.getElementById('topping-chips');
    if (chips) {
      const req = order.toppings.filter(t=>t!=='dough');
      const avail = Object.keys(S.inventory).filter(k=>k!=='dough'&&S.inventory[k]>0);
      chips.innerHTML = avail.map(t => {
        const isReq = req.includes(t);
        const isAdded = cookingToppings.includes(t);
        return `<div class="topping-chip3d${isReq?' required':''}${isAdded?' added':''}"
          onclick="Game.addTopping3D('${t}')" data-ing="${t}">
          <div class="tc-icon">${IngredientIcons[t]||''}</div>
          <div class="tc-name">${t}</div>
          ${isReq?'<div class="tc-req">&#10003;</div>':''}
        </div>`;
      }).join('');
    }

    const doneBtn = document.getElementById('btn-toppings-done');
    if (doneBtn) {
      doneBtn.onclick = () => {
        const req = order.toppings.filter(t=>t!=='dough');
        const missing = req.filter(r=>!cookingToppings.includes(r));
        if (missing.length) { showToast('Fehlt noch: ' + missing.join(', ')); return; }
        _startCookStep(3);
      };
    }
  }

  function addTopping3D(topping) {
    if (cookingToppings.includes(topping)) return;
    if ((S.inventory[topping]||0) <= 0) { showToast('Kein ' + topping + ' mehr!'); return; }
    cookingToppings.push(topping);
    const chip = document.querySelector(`.topping-chip3d[data-ing="${topping}"]`);
    if (chip) chip.classList.add('added');
    if (_cookRedraw) _cookRedraw();
    const order = currentOrders.find(o=>String(o.id)===String(cookingOrderId));
    if (order) {
      const req = order.toppings.filter(t=>t!=='dough');
      if (req.every(r=>cookingToppings.includes(r))) {
        showToast('Alle Zutaten drauf! In den Ofen!');
      }
    }
  }

  // ---- STEP 3: OVEN ----
  function _initOven() {
    const peel = document.getElementById('ck-peel-pizza');
    if (!peel) { _startCookStep(4); return; }
    peel.style.transform = 'translateX(0)';
    peel.style.transition = 'none';
    let startX = null;
    let moved = false;

    function advance() {
      if (moved) return;
      moved = true;
      peel.style.transition = 'transform .35s ease';
      peel.style.transform  = 'translateX(220px)';
      peel.removeEventListener('touchstart', onTS, {passive:false});
      peel.removeEventListener('touchmove',  onTM, {passive:false});
      peel.removeEventListener('mousedown',  onMD);
      document.removeEventListener('mousemove', onMM);
      document.removeEventListener('mouseup',   onMU);
      setTimeout(() => _startCookStep(4), 450);
    }

    function onTS(e) { e.preventDefault(); startX=e.touches[0].clientX; }
    function onTM(e) {
      e.preventDefault();
      if (startX===null) return;
      const dx=e.touches[0].clientX-startX;
      if (dx>0) peel.style.transform=`translateX(${Math.min(dx,220)}px)`;
      if (dx>100) advance();
    }
    let mDown=false;
    function onMD(e) { mDown=true; startX=e.clientX; }
    function onMM(e) {
      if (!mDown||startX===null) return;
      const dx=e.clientX-startX;
      if (dx>0) peel.style.transform=`translateX(${Math.min(dx,220)}px)`;
      if (dx>100) advance();
    }
    function onMU() { mDown=false; startX=null; }
    peel.addEventListener('touchstart', onTS, {passive:false});
    peel.addEventListener('touchmove',  onTM, {passive:false});
    peel.addEventListener('touchend',   () => { startX=null; }, {passive:false});
    peel.addEventListener('mousedown',  onMD);
    document.addEventListener('mousemove', onMM);
    document.addEventListener('mouseup',   onMU);
  }

  // ---- STEP 4: BAKING ----
  function _startBaking() {
    const bar  = document.getElementById('baking-bar');
    const time = Math.max(1500, 3000 - (S.upgrades.oven-1)*400);
    const t0   = Date.now();
    function tick() {
      const pct = Math.min((Date.now()-t0)/time, 1);
      if (bar) bar.style.width = (pct*100)+'%';
      if (pct < 1) setTimeout(tick, 40);
      else setTimeout(() => _startCookStep(5), 250);
    }
    tick();
  }

  // ---- STEP 5: RESULT ----
  function _showResult() {
    const order = currentOrders.find(o=>String(o.id)===String(cookingOrderId));
    if (!order) { closeCooking3D(); return; }
    if ((S.inventory.dough||0) <= 0) { showToast('Kein Teig!'); closeCooking3D(); return; }

    S.inventory.dough--;
    cookingToppings.forEach(t => { if ((S.inventory[t]||0)>0) S.inventory[t]--; });

    const req     = order.toppings.filter(t=>t!=='dough');
    const matched = req.filter(r=>cookingToppings.includes(r)).length;
    const extra   = cookingToppings.filter(t=>!req.includes(t)&&t!=='dough').length;
    const quality = req.length>0 ? matched/req.length : 1;
    let stars=1, bonus=-2;
    if (quality===1&&extra===0) { stars=3; bonus=3; }
    else if (quality>=0.6)       { stars=2; bonus=1; }

    order.done  = true;
    order.price = Math.max(5, order.price+bonus);
    S.stats.pizzasMade++;
    S.repPoints = (S.repPoints||0) + (quality>=1?3:quality>=0.6?1:0);
    if (S.repPoints >= 10+S.reputation*6) { S.repPoints=0; S.reputation=Math.min(S.reputation+0.5,5); }

    try { if (typeof GameAudio!=='undefined') GameAudio.playSuccess&&GameAudio.playSuccess(); } catch(e){}

    const pizzaEl  = document.getElementById('ck-result-pizza');
    const starsEl  = document.getElementById('ck-result-stars');
    const labelEl  = document.getElementById('ck-result-label');
    const earnEl   = document.getElementById('ck-result-earn');
    if (pizzaEl) pizzaEl.innerHTML = buildPizzaSVG(cookingToppings, 130);
    if (starsEl) starsEl.innerHTML = '★★★'.split('').map((s,i)=>
      `<span style="color:${i<stars?'var(--c-gold)':'rgba(255,255,255,.15)'}">${s}</span>`
    ).join('');
    if (labelEl) labelEl.textContent = stars===3?'Perfektion!':stars===2?'Sehr gut!':'Geht so…';
    if (earnEl)  earnEl.textContent  = '+' + formatMoney(order.price);

    const btn = document.getElementById('btn-serve');
    if (btn) btn.onclick = () => {
      save();
      closeCooking3D();
      showToast(order.name + ' serviert! +' + formatMoney(order.price));
    };
  }

  // -------- INIT --------
  function init() {
    document.getElementById('btn-newgame').addEventListener('click', () => {
      newGame();
      showScreen('screen-loading');
      const lp = document.getElementById('loading-pizza');
      if (lp) lp.innerHTML = buildPizzaSVG(['sauce','cheese'], 100);
      setTimeout(initWorld, 50);
    });

    document.getElementById('btn-continue').addEventListener('click', () => {
      loadGame();
      showScreen('screen-loading');
      const lp = document.getElementById('loading-pizza');
      if (lp) lp.innerHTML = buildPizzaSVG(['sauce','cheese','salami'], 100);
      setTimeout(initWorld, 50);
    });

    // 2D kitchen buttons (fallback)
    document.getElementById('btn-kitchen-bake').addEventListener('click', bake);
    document.getElementById('btn-kitchen-reset').addEventListener('click', () => { kitchenToppings=[]; renderKitchen(); });
    document.getElementById('btn-kitchen-cancel').addEventListener('click', () => { closeKitchen(); openManagement(); });

    // 3D kitchen/counter proximity buttons
    const btnKitchen = document.getElementById('btn-kitchen-enter');
    if (btnKitchen) btnKitchen.addEventListener('click', () => openCooking3D());
    const btnCounter = document.getElementById('btn-counter-open');
    if (btnCounter) btnCounter.addEventListener('click', () => { touchControls_hide(); openManagement(); });

    // Download-skip button
    const skipBtn = document.getElementById('btn-dl-skip');
    if (skipBtn) skipBtn.addEventListener('click', () => {
      if (typeof AssetDownloader !== 'undefined') AssetDownloader.markComplete && AssetDownloader.markComplete();
      showTitleScreen();
    });

    Story.init();

    // First-launch: show download screen before title
    if (typeof AssetDownloader !== 'undefined' && !AssetDownloader.isComplete()) {
      showScreen('screen-download');
      AssetDownloader.run(() => showTitleScreen());
    } else {
      showTitleScreen();
    }
  }

  return {
    init, applyEffect, setGangEvent, setPoliceEvent,
    showGameScreen, openManagement, closeManagement,
    openKitchen, toggleTopping, buyIngredient,
    upgrade, hireStaff, endDay, nextDay,
    triggerEnding, restartGame,
    // New in Phase 6
    openPause, closePause, exitToMenu,
    openCooking3D, closeCooking3D, onDoughTap, addTopping3D,
  };
})();

// -------- HELPERS --------
function formatMoney(n) { return (Math.round(n||0)).toLocaleString('de-DE') + ' €'; }
function clamp(v,min,max) { return Math.max(min,Math.min(max,v)); }
function showToast(msg) {
  const wrap = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 2700);
}

// -------- BOOT --------
document.addEventListener('DOMContentLoaded', () => Game.init());
window.handleAndroidBack = () => {
  const ovPause = document.getElementById('overlay-pause');
  const ovCook  = document.getElementById('overlay-cooking');
  const ov1     = document.getElementById('overlay-summary');
  const ov2     = document.getElementById('overlay-kitchen');
  const ov3     = document.getElementById('overlay-management');
  if (ovCook  && !ovCook.classList.contains('hidden'))  { Game.closeCooking3D(); return 'handled'; }
  if (ovPause && !ovPause.classList.contains('hidden')) { Game.closePause();     return 'handled'; }
  if (ov1 && !ov1.classList.contains('hidden')) { ov1.classList.add('hidden'); return 'handled'; }
  if (ov2 && !ov2.classList.contains('hidden')) { ov2.classList.add('hidden'); return 'handled'; }
  if (ov3 && !ov3.classList.contains('hidden')) { Game.closeManagement();      return 'handled'; }
  const title = document.getElementById('screen-title');
  if (title && title.classList.contains('active')) return 'exit';
  // In-game: open pause instead of exiting
  if (typeof Game !== 'undefined') Game.openPause();
  return 'handled';
};
