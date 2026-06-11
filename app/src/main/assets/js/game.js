// ============================================
// PIZZA EMPIRE – GAME ENGINE
// ============================================

const SAVE_KEY = 'pizza_empire_save_v1';

const DEFAULT_STATE = {
  day: 1,
  money: 350,
  reputation: 1,       // 0-5 stars
  repPoints: 0,        // accumulated
  morality: 0,         // -10 (criminal) to +10 (honest)
  gangTrust: 0,        // -5 to +5
  policeTrust: 0,      // -5 to +5
  gangEvent: null,     // 'paid','refused','stall'
  policeEvent: null,
  storyFlags: {},
  inventory: { sauce: 5, cheese: 5, salami: 3, mushrooms: 3, peppers: 2, olives: 2, basil: 2, pineapple: 0, dough: 8 },
  upgrades: {
    oven: 1,           // 1-4
    decor: 1,          // 1-4
    dining: 1,         // 1-4
    recipes: 1,        // 1-3 (unlocks new pizza types)
    signage: 0,        // 0-1
    delivery: 0,       // 0-1
  },
  staff: {
    cook: false,
    waiter: false,
    delivery: false,
  },
  stats: {
    pizzasMade: 0,
    totalEarned: 0,
    customersServed: 0,
    ordersCompleted: 0,
  },
  todayOrders: [],
  todayCompleted: 0,
  todayRevenue: 0,
  todayExpenses: 0,
  gangWarningShown: false,
  policeVisitShown: false,
  finalDecisionUnlocked: false,
};

// ============================================
const Game = (() => {
  let S = null; // game state
  let activeTab = 'service';
  let currentOrders = [];
  let kitchenOrder = null;
  let kitchenToppings = [];

  // -------- SAVE / LOAD --------
  function save() {
    try {
      S.todayOrders = currentOrders;
      localStorage.setItem(SAVE_KEY, JSON.stringify(S));
    } catch(e) {}
  }
  window.gameAutoSave = save;

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
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
    if (saved) {
      S = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), saved);
      currentOrders = S.todayOrders || [];
    } else {
      newGame();
    }
  }

  // -------- EFFECTS --------
  function applyEffect(fx) {
    if (!S) return;
    if (fx.money) S.money += fx.money;
    if (fx.gangTrust) S.gangTrust = clamp(S.gangTrust + fx.gangTrust, -5, 5);
    if (fx.policeTrust) S.policeTrust = clamp(S.policeTrust + fx.policeTrust, -5, 5);
    if (fx.morality) S.morality = clamp(S.morality + fx.morality, -10, 10);
    if (fx.reputation) S.reputation = clamp(S.reputation + fx.reputation, 0, 5);
    save();
  }

  function setGangEvent(e) { if (S) { S.gangEvent = e; save(); } }
  function setPoliceEvent(e) { if (S) { S.policeEvent = e; save(); } }

  // -------- RECIPES / ORDERS --------
  const RECIPES = {
    margherita: { name: 'Margherita', toppings: ['sauce','cheese','basil'], price: 9 },
    salami:     { name: 'Salami',     toppings: ['sauce','cheese','salami'], price: 11 },
    veggie:     { name: 'Veggie',     toppings: ['sauce','cheese','peppers','mushrooms','olives'], price: 12 },
    hawaii:     { name: 'Hawaii',     toppings: ['sauce','cheese','pineapple'], price: 11 },
    special:    { name: 'Speciale',   toppings: ['sauce','cheese','salami','peppers','mushrooms'], price: 14 },
  };

  function availableRecipes() {
    const lvl = S.upgrades.recipes;
    const all = ['margherita','salami'];
    if (lvl >= 2) all.push('veggie','hawaii');
    if (lvl >= 3) all.push('special');
    return all;
  }

  function generateOrder() {
    const pool = availableRecipes();
    const type = pool[Math.floor(Math.random() * pool.length)];
    const recipe = RECIPES[type];
    const urgency = Math.random() < 0.3; // 30% urgent
    return {
      id: Date.now() + Math.random(),
      type,
      name: recipe.name,
      price: recipe.price + Math.floor(S.reputation),
      toppings: [...recipe.toppings],
      done: false,
      urgent: urgency,
      timeLeft: urgency ? 45 : 90,
    };
  }

  function refillOrders() {
    const capacity = 2 + S.upgrades.dining + (S.staff.waiter ? 1 : 0);
    while (currentOrders.filter(o => !o.done).length < capacity) {
      currentOrders.push(generateOrder());
    }
    renderServiceTab();
  }

  // -------- SHOP DATA --------
  const SHOP_ITEMS = [
    { id: 'sauce',      name: 'Tomatensauce',  desc: '5 Portionen', price: 8,  qty: 5 },
    { id: 'cheese',     name: 'Mozzarella',    desc: '5 Portionen', price: 10, qty: 5 },
    { id: 'dough',      name: 'Pizzateig',     desc: '8 Portionen', price: 7,  qty: 8 },
    { id: 'salami',     name: 'Salami',        desc: '5 Portionen', price: 9,  qty: 5 },
    { id: 'mushrooms',  name: 'Champignons',   desc: '5 Portionen', price: 7,  qty: 5 },
    { id: 'peppers',    name: 'Paprika',       desc: '5 Portionen', price: 6,  qty: 5 },
    { id: 'olives',     name: 'Oliven',        desc: '4 Portionen', price: 6,  qty: 4 },
    { id: 'basil',      name: 'Basilikum',     desc: '6 Portionen', price: 4,  qty: 6 },
    { id: 'pineapple',  name: 'Ananas',        desc: '4 Portionen', price: 5,  qty: 4, requiresRecipe: 2 },
  ];

  // -------- BUILD UPGRADES --------
  const UPGRADES = {
    oven:     { name: 'Ofen',           maxLevel: 4, costs: [0, 300, 600, 1200], desc: ['Standard-Ofen','Doppel-Ofen','Steinofen','Profi-Holzofen'], benefit: 'Schnelleres Backen' },
    decor:    { name: 'Einrichtung',    maxLevel: 4, costs: [0, 200, 450, 900],  desc: ['Kahl','Einfach','Gemütlich','Elegant'],                     benefit: '+Kundenzufriedenheit' },
    dining:   { name: 'Speisesaal',     maxLevel: 4, costs: [0, 250, 500, 1000], desc: ['4 Tische','8 Tische','14 Tische','VIP-Bereich'],            benefit: '+Kapazität' },
    recipes:  { name: 'Rezeptbuch',     maxLevel: 3, costs: [0, 180, 450],       desc: ['Basis','Erweitert','Gourmet'],                              benefit: 'Neue Pizzen' },
    signage:  { name: 'Werbeschild',    maxLevel: 1, costs: [0, 150],            desc: ['Kein Schild','Leuchtreklame'],                              benefit: '+Kundenstrom' },
    delivery: { name: 'Lieferservice',  maxLevel: 1, costs: [0, 250],            desc: ['Kein Lieferdienst','Lieferfahrrad'],                        benefit: '+Bestellungen' },
  };

  // -------- STAFF --------
  const STAFF_LIST = [
    { id: 'cook',     name: 'Luigi',    role: 'Sous-Chef',    costPerDay: 40, portrait: 'unknown', hirePrice: 0 },
    { id: 'waiter',   name: 'Rosa',     role: 'Servicekraft', costPerDay: 30, portrait: 'rosa',    hirePrice: 0 },
    { id: 'delivery', name: 'Benni',    role: 'Fahrer',       costPerDay: 25, portrait: 'unknown', hirePrice: 0, requiresUpgrade: 'delivery' },
  ];

  // -------- HUD --------
  function updateHUD() {
    document.getElementById('hud-day').textContent = `Tag ${S.day}`;
    document.getElementById('hud-money').textContent = formatMoney(S.money);
    // Stars
    const starsEl = document.getElementById('hud-stars');
    starsEl.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const s = document.createElement('span');
      s.className = 'star-icon' + (i <= Math.round(S.reputation) ? ' lit' : '');
      s.textContent = '★';
      starsEl.appendChild(s);
    }
    // Rep dots
    const repEl = document.getElementById('hud-rep');
    repEl.innerHTML = '';
    // reputation text
    const repLabels = ['Unbekannt','Bekannt','Beliebt','Gefeiert','Stadtlegende','Ikone'];
    repEl.textContent = repLabels[Math.min(Math.round(S.reputation), 5)];
  }

  // -------- TAB SWITCHING --------
  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.getElementById('tab-' + tab).classList.add('active');
    renderTab(tab);
  }

  function renderTab(tab) {
    if (tab === 'service') renderServiceTab();
    else if (tab === 'shop') renderShopTab();
    else if (tab === 'build') renderBuildTab();
    else if (tab === 'office') renderOfficeTab();
  }

  // -------- SERVICE TAB --------
  function renderServiceTab() {
    const el = document.getElementById('tab-service');
    // build order queue HTML
    let html = `<div class="card">
      <div class="card-title">Aktuelle Bestellungen</div>
      <div class="order-queue">`;

    const active = currentOrders.filter(o => !o.done);
    if (active.length === 0) {
      html += `<div style="color:var(--c-text3);font-size:13px;text-align:center;padding:12px">Keine Bestellungen – warte auf Kunden…</div>`;
    } else {
      active.forEach(order => {
        const urgent = order.urgent ? ' urgent' : '';
        html += `<div class="order-item${urgent}" data-oid="${order.id}">
          <div class="order-pizza-thumb">${pizzaThumb(order.type)}</div>
          <div class="order-info">
            <div class="order-name">${order.name}</div>
            <div class="order-desc">${order.toppings.join(', ')}</div>
          </div>
          <div class="order-actions" style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            <div class="order-timer${order.urgent?' urgent':''}">${formatMoney(order.price)}</div>
            <button class="btn btn-small btn-gold" onclick="Game.openKitchen('${order.id}')">Zubereiten</button>
          </div>
        </div>`;
      });
    }

    html += `</div></div>`;

    // Gang warning if applicable
    if (S.gangEvent && !S.gangWarningShown && S.day >= 3) {
      html += gangWarningCard();
    }

    // Day end button
    const revenue = currentOrders.filter(o => o.done).reduce((a, o) => a + o.price, 0);
    html += `<div class="card" style="margin-top:4px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div><div class="card-title">Heutige Einnahmen</div><div class="card-big-num">${formatMoney(revenue)}</div></div>
        <div style="text-align:right"><div class="card-title">Erledigt</div><div class="card-big-num">${currentOrders.filter(o=>o.done).length}/${currentOrders.length}</div></div>
      </div>
      <button class="btn btn-gold" onclick="Game.endDay()">Tag beenden &amp; kassieren</button>
    </div>`;

    el.innerHTML = html;

    // Inject tab icons
    document.querySelectorAll('.tab-ico').forEach(ico => {
      const name = ico.dataset.ico;
      if (Icons[name]) ico.innerHTML = Icons[name];
    });
  }

  function gangWarningCard() {
    const gangMsg = {
      paid: 'Marco erwartet seine 500 € am Monatsende. Die erste Zahlung steht bald an…',
      refused: 'Marco ist sauer. Du hörst Gerüchte – irgendjemand schreibt Bewertungen gegen dich…',
      stall: 'Marco wartet auf deine Entscheidung. Sein Geduld schwindet.',
    };
    return `<div class="gang-alert">
      <div class="gang-icon">⚠️</div>
      <div>
        <div class="gang-text">${gangMsg[S.gangEvent] || 'Die Russoni-Gruppe beobachtet dich.'}</div>
        <div class="gang-actions">
          <button class="btn btn-small btn-red" onclick="Game.triggerGangStory()">Reagieren</button>
        </div>
      </div>
    </div>`;
  }

  // -------- KITCHEN OVERLAY --------
  function openKitchen(orderId) {
    const order = currentOrders.find(o => o.id == orderId);
    if (!order || order.done) return;
    kitchenOrder = order;
    kitchenToppings = [];
    const ov = document.getElementById('overlay-kitchen');
    ov.classList.remove('hidden');
    renderKitchen();
  }
  window.Game = window.Game || {};

  function renderKitchen() {
    if (!kitchenOrder) return;
    document.getElementById('kitchen-order').innerHTML =
      `Bestellung: <strong>${kitchenOrder.name}</strong> – ${formatMoney(kitchenOrder.price)}<br>
       <span style="font-size:12px;color:var(--c-text3)">Benötigt: ${kitchenOrder.toppings.join(', ')}</span>`;

    // pizza preview
    document.getElementById('kitchen-pizza').innerHTML = buildPizzaSVG(kitchenToppings, 160);

    // topping chips
    const available = Object.keys(S.inventory).filter(k => k !== 'dough');
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
    if (S.inventory[ing] <= 0 && !kitchenToppings.includes(ing)) { showToast('Zu wenig ' + ing + ' vorrätig!'); return; }
    const idx = kitchenToppings.indexOf(ing);
    if (idx >= 0) kitchenToppings.splice(idx, 1);
    else kitchenToppings.push(ing);
    renderKitchen();
  }

  function bake() {
    if (!kitchenOrder) return;
    // check if dough available
    if (S.inventory.dough <= 0) { showToast('Kein Teig mehr!'); return; }
    // Deduct toppings + dough
    S.inventory.dough--;
    kitchenToppings.forEach(t => { if (S.inventory[t] > 0) S.inventory[t]--; });
    // Check quality
    const required = kitchenOrder.toppings;
    const matched = required.filter(r => kitchenToppings.includes(r)).length;
    const extra = kitchenToppings.filter(t => !required.includes(t)).length;
    const quality = matched / required.length;
    let bonus = 0;
    if (quality === 1 && extra === 0) { bonus = 2; showToast('🍕 Perfekte Pizza! +2€ Bonus'); }
    else if (quality >= 0.6) { showToast('Gute Pizza!'); }
    else { bonus = -2; showToast('Pizza nicht ideal…'); }
    kitchenOrder.done = true;
    kitchenOrder.price += bonus;
    S.stats.pizzasMade++;
    S.stats.ordersCompleted++;
    // rep points
    S.repPoints += quality >= 1 ? 3 : quality >= 0.6 ? 1 : 0;
    if (S.repPoints >= 10 + S.reputation * 5) {
      S.repPoints = 0;
      S.reputation = Math.min(S.reputation + 0.5, 5);
    }
    closeKitchen();
    renderServiceTab();
    updateHUD();
    save();
  }

  function closeKitchen() {
    document.getElementById('overlay-kitchen').classList.add('hidden');
    kitchenOrder = null;
    kitchenToppings = [];
  }

  // -------- SHOP TAB --------
  function renderShopTab() {
    const el = document.getElementById('tab-shop');
    let html = `<div class="card"><div class="card-title">Zutaten kaufen</div>
      <div style="font-size:13px;color:var(--c-text2);margin-bottom:12px">Guthaben: <strong style="color:var(--c-gold)">${formatMoney(S.money)}</strong></div>
      <div class="shop-grid">`;
    SHOP_ITEMS.forEach(item => {
      if (item.requiresRecipe && S.upgrades.recipes < item.requiresRecipe) return;
      const canAfford = S.money >= item.price;
      const stock = S.inventory[item.id] || 0;
      html += `<div class="shop-item">
        <div class="shop-icon">${IngredientIcons[item.id] || ''}</div>
        <div class="shop-info">
          <div class="shop-name">${item.name}</div>
          <div class="shop-desc">Vorrat: ${stock} | ${item.desc}</div>
          <div class="shop-price">${formatMoney(item.price)}</div>
        </div>
        <button class="shop-buy ${canAfford?'':'disabled'}" onclick="Game.buyIngredient('${item.id}')">Kaufen</button>
      </div>`;
    });
    html += `</div></div>`;
    el.innerHTML = html;
  }

  function buyIngredient(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    if (S.money < item.price) { showToast('Nicht genug Geld!'); return; }
    S.money -= item.price;
    S.inventory[id] = (S.inventory[id] || 0) + item.qty;
    S.todayExpenses += item.price;
    showToast(`${item.name} gekauft (+${item.qty})`);
    updateHUD();
    renderShopTab();
    save();
  }

  // -------- BUILD TAB --------
  function renderBuildTab() {
    const el = document.getElementById('tab-build');
    let html = `<div class="card"><div class="card-title">Renovierung &amp; Upgrades</div><div class="build-grid">`;
    Object.keys(UPGRADES).forEach(key => {
      const upg = UPGRADES[key];
      const currentLvl = S.upgrades[key];
      const maxed = currentLvl >= upg.maxLevel;
      const nextCost = maxed ? 0 : upg.costs[currentLvl];
      const canAfford = !maxed && S.money >= nextCost;
      const classes = `build-card${maxed?' maxed':''}${(!maxed && !canAfford)?' locked':''}`;
      html += `<div class="${classes}" onclick="Game.upgrade('${key}')">
        <div class="build-icon">${buildIcon(key)}</div>
        <div class="build-name">${upg.name}</div>
        <div class="build-level">${upg.desc[currentLvl-1] || upg.desc[0]} (Stufe ${currentLvl}/${upg.maxLevel})</div>
        <div class="build-cost ${maxed?'maxed':''}">${maxed ? '✓ Max' : formatMoney(nextCost)}</div>
        <div style="font-size:10px;color:var(--c-text3)">${upg.benefit}</div>
      </div>`;
    });
    html += `</div></div>`;
    el.innerHTML = html;
  }

  function upgrade(key) {
    const upg = UPGRADES[key];
    const currentLvl = S.upgrades[key];
    if (currentLvl >= upg.maxLevel) { showToast('Bereits maximal ausgebaut!'); return; }
    const cost = upg.costs[currentLvl];
    if (S.money < cost) { showToast('Nicht genug Geld!'); return; }
    S.money -= cost;
    S.upgrades[key]++;
    showToast(`${upg.name} auf Stufe ${S.upgrades[key]} ausgebaut!`);
    updateHUD();
    renderBuildTab();
    save();
  }

  function buildIcon(key) {
    const icons = {
      oven:     `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="10" width="44" height="36" rx="6" fill="#2E2820" stroke="#F5C542" stroke-width="1.5"/><rect x="10" y="18" width="32" height="22" rx="4" fill="#1a1208" stroke="#C87A20" stroke-width="1.2"/><circle cx="15" cy="14" r="2.5" fill="#F5C542"/><circle cx="26" cy="14" r="2.5" fill="#F5C542"/><circle cx="37" cy="14" r="2.5" fill="#C73E1D"/><path d="M15 28 Q26 23 37 28" stroke="#C73E1D" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
      decor:    `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="30" width="14" height="18" rx="2" fill="#2E2820" stroke="#F5C542" stroke-width="1.2"/><rect x="22" y="20" width="10" height="28" rx="2" fill="#2E2820" stroke="#F5C542" stroke-width="1.2"/><rect x="34" y="25" width="14" height="23" rx="2" fill="#2E2820" stroke="#F5C542" stroke-width="1.2"/><path d="M4 48 L48 48" stroke="#C87A20" stroke-width="2" stroke-linecap="round"/><circle cx="13" cy="16" r="5" fill="#C73E1D" opacity=".7"/><circle cx="27" cy="8" r="4" fill="#F5C542" opacity=".7"/><circle cx="41" cy="12" r="4" fill="#3E8A30" opacity=".7"/></svg>`,
      dining:   `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="18" width="32" height="20" rx="3" fill="#2E2820" stroke="#F5C542" stroke-width="1.2"/><rect x="4" y="38" width="10" height="10" rx="2" fill="#241F1A" stroke="#C87A20" stroke-width="1"/><rect x="38" y="38" width="10" height="10" rx="2" fill="#241F1A" stroke="#C87A20" stroke-width="1"/><circle cx="26" cy="28" r="5" fill="#C73E1D" opacity=".6"/><path d="M18 18 L18 10 M34 18 L34 10" stroke="#C87A20" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      recipes:  `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="6" width="30" height="40" rx="4" fill="#2E2820" stroke="#F5C542" stroke-width="1.2"/><path d="M16 16 L36 16 M16 22 L36 22 M16 28 L28 28" stroke="#C87A20" stroke-width="1.5" stroke-linecap="round"/><circle cx="32" cy="36" r="7" fill="#C73E1D" opacity=".7"/><path d="M29 36 L31 38 L35 33" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      signage:  `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="40" height="26" rx="5" fill="#1a1208" stroke="#F5C542" stroke-width="1.8"/><text x="26" y="25" font-size="14" font-weight="bold" fill="#F5C542" text-anchor="middle" font-family="Georgia,serif">PIZZA</text><path d="M26 32 L26 46" stroke="#C87A20" stroke-width="2.5" stroke-linecap="round"/><path d="M18 46 L34 46" stroke="#C87A20" stroke-width="2" stroke-linecap="round"/></svg>`,
      delivery: `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 34 L8 22 L28 16 L44 22 L44 34" stroke="#F5C542" stroke-width="1.5" fill="none" stroke-linejoin="round"/><rect x="6" y="34" width="40" height="8" rx="2" fill="#2E2820" stroke="#C87A20" stroke-width="1.2"/><circle cx="16" cy="43" r="4" fill="#1a1208" stroke="#F5C542" stroke-width="1.5"/><circle cx="36" cy="43" r="4" fill="#1a1208" stroke="#F5C542" stroke-width="1.5"/><path d="M24 16 L24 28 L34 28" stroke="#C73E1D" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
    };
    return icons[key] || '';
  }

  // -------- OFFICE TAB --------
  function renderOfficeTab() {
    const el = document.getElementById('tab-office');
    let html = `<div class="office-section"><div class="office-section-title">Personal einstellen</div><div class="staff-grid">`;
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
          : `<button class="staff-hire" onclick="Game.hireStaff('${staff.id}')">Einstellen</button>`
        }
      </div>`;
    });
    html += `</div></div>`;

    // Finance overview
    const dailyStaffCost = STAFF_LIST.filter(s => S.staff[s.id]).reduce((a, s) => a + s.costPerDay, 0);
    const gangCost = S.gangEvent === 'paid' ? 500 : 0;
    html += `<div class="office-section"><div class="office-section-title">Finanzen</div>
      <div class="card">
        <div class="income-row"><span>Heute Einnahmen</span><span class="income-pos">+${formatMoney(currentOrders.filter(o=>o.done).reduce((a,o)=>a+o.price,0))}</span></div>
        <div class="income-row"><span>Zutaten-Einkauf</span><span class="income-neg">-${formatMoney(S.todayExpenses)}</span></div>
        <div class="income-row"><span>Personal (tägl.)</span><span class="income-neg">-${formatMoney(dailyStaffCost)}</span></div>
        ${gangCost ? `<div class="income-row"><span style="color:var(--c-gang)">Schutzgeld (monatl.)</span><span class="income-neg">-500 €</span></div>` : ''}
        <div class="income-row"><span>Kontostand</span><span class="income-pos">${formatMoney(S.money)}</span></div>
      </div>
    </div>`;

    // Story flags / achievements
    html += `<div class="office-section"><div class="office-section-title">Fortschritt</div>
      <div class="card">
        <div class="income-row"><span>Pizzen gebacken</span><span>${S.stats.pizzasMade}</span></div>
        <div class="income-row"><span>Kunden bedient</span><span>${S.stats.customersServed}</span></div>
        <div class="income-row"><span>Gesamteinnahmen</span><span class="income-pos">${formatMoney(S.stats.totalEarned)}</span></div>
        <div class="income-row"><span>Ruf</span><span>${'★'.repeat(Math.round(S.reputation))}${'☆'.repeat(5-Math.round(S.reputation))}</span></div>
        <div class="income-row"><span>Moral</span><span style="color:${S.morality>0?'var(--c-green)':S.morality<0?'var(--c-red)':'var(--c-text2)'}">${S.morality > 3 ? 'Ehrenhaft' : S.morality > 0 ? 'Neutral' : S.morality < -3 ? 'Kriminell' : 'Grauzone'}</span></div>
      </div>
    </div>`;

    el.innerHTML = html;
  }

  function hireStaff(id) {
    S.staff[id] = true;
    showToast('Personal eingestellt!');
    renderOfficeTab();
    save();
  }

  // -------- DAY END --------
  function endDay() {
    const revenue = currentOrders.filter(o => o.done).reduce((a, o) => a + o.price, 0);
    const dailyStaffCost = STAFF_LIST.filter(s => S.staff[s.id]).reduce((a, s) => a + s.costPerDay, 0);
    S.money += revenue;
    S.money -= dailyStaffCost;
    S.stats.totalEarned += revenue;
    S.stats.customersServed += currentOrders.filter(o => o.done).length;
    S.todayRevenue = revenue;
    S.todayExpenses += dailyStaffCost;

    // Monthly gang payment
    if (S.gangEvent === 'paid' && S.day % 30 === 0) {
      S.money -= 500;
      showToast('500 € Schutzgeld bezahlt.');
    }

    showSummary(revenue, dailyStaffCost);
  }

  function showSummary(revenue, staffCost) {
    const ov = document.getElementById('overlay-summary');
    ov.classList.remove('hidden');
    const panel = document.getElementById('summary-panel');

    const profit = revenue - staffCost - S.todayExpenses;
    const icon = profit > 0 ? '📈' : '📉';
    const completed = currentOrders.filter(o => o.done).length;

    // story events
    let eventHtml = '';
    if (S.day === 3 && S.gangEvent === null) {
      eventHtml = `<div class="summary-event" style="border-color:rgba(139,26,46,.5);background:rgba(139,26,46,.1)">
        <strong style="color:var(--c-gang)">⚠️ Abends…</strong><br>
        Drei Männer betreten deinen Laden kurz vor Schließzeit. Das Gespräch ist nicht angenehm.
      </div>`;
    }
    if (S.day === 6 && S.policeEvent === null && S.gangEvent) {
      eventHtml += `<div class="summary-event" style="border-color:rgba(45,111,164,.5);background:rgba(45,111,164,.1)">
        <strong style="color:var(--c-blue)">🚔 Polizeibesuch…</strong><br>
        Inspektor Bauer fragt nach deinem Onkel und gewissen Bekannten.
      </div>`;
    }
    if (S.day >= 14 && !S.finalDecisionUnlocked && S.gangEvent && S.policeEvent) {
      S.finalDecisionUnlocked = true;
      eventHtml += `<div class="summary-event" style="border-color:rgba(245,197,66,.4);background:rgba(245,197,66,.05)">
        <strong style="color:var(--c-gold)">💬 Die Zeit ist gekommen…</strong><br>
        Beide Seiten warten auf eine Entscheidung. Du kannst es nicht länger hinauszögern.
      </div>`;
    }

    panel.innerHTML = `
      <div class="summary-icon">${icon}</div>
      <div class="summary-title">Tag ${S.day} beendet</div>
      <div class="summary-day">${new Date().toLocaleDateString('de-DE')}</div>
      <div class="summary-stats">
        <div class="summary-stat"><span>Bestellungen erledigt</span><span>${completed}/${currentOrders.length}</span></div>
        <div class="summary-stat"><span>Einnahmen</span><span class="income-pos">+${formatMoney(revenue)}</span></div>
        <div class="summary-stat"><span>Ausgaben</span><span class="income-neg">-${formatMoney(staffCost + S.todayExpenses)}</span></div>
        <div class="summary-stat"><span>Gewinn</span><span style="color:${profit>=0?'var(--c-green)':'var(--c-red)'}">${profit>=0?'+':''}${formatMoney(profit)}</span></div>
        <div class="summary-stat"><span>Kontostand</span><span style="color:var(--c-gold)">${formatMoney(S.money)}</span></div>
      </div>
      ${eventHtml}
      <button class="btn btn-gold" style="width:88%;max-width:340px" onclick="Game.nextDay()">Nächster Tag →</button>
    `;
  }

  function nextDay() {
    // Advance day
    S.day++;
    S.todayExpenses = 0;
    S.todayRevenue = 0;
    currentOrders = [];
    document.getElementById('overlay-summary').classList.add('hidden');

    // Check story triggers
    if (S.day === 3 && S.gangEvent === null) {
      Story.playChapter('gang_intro', () => {});
      return;
    }
    if (S.day === 6 && S.policeEvent === null && S.gangEvent !== null) {
      Story.playChapter('police_intro', () => {});
      return;
    }
    if (S.day >= 14 && S.finalDecisionUnlocked && !S.storyFlags.finalDone) {
      S.storyFlags.finalDone = true;
      Story.playChapter('final_decision', () => {});
      return;
    }

    // Reputation decay prevention
    if (S.money < 0) { showToast('Achtung: Schulden! Kasse ist leer.'); S.money = 0; }

    refillOrders();
    switchTab('service');
    updateHUD();
    save();
  }

  // -------- GANG / POLICE triggers --------
  function triggerGangStory() {
    S.gangWarningShown = true;
    Story.playChapter('police_intro', () => {});
  }

  function triggerEnding(type) {
    const msgs = {
      honest: { title: 'Ende: Restaurant-König 👑', text: 'Du hast alles richtig gemacht. Ein fairer Laden, treue Kunden, ein reines Gewissen.', color: 'var(--c-green)' },
      gang:   { title: 'Ende: Gang übernimmt 😬',  text: 'Der Laden läuft – aber er gehört dir nicht mehr wirklich. Willkommen im Kartell.', color: 'var(--c-gang)' },
      police: { title: 'Ende: Polizei deckt auf 🚔', text: 'Marco ist hinter Gittern. Der Laden ist sauber. Aber war es der einfachste Weg?', color: 'var(--c-blue)' },
      empire: { title: 'Ende: Restaurant-Kette 🌍',  text: 'Berlin. Wien. Zürich. Du hast alle überlistet und ein echtes Imperium aufgebaut.', color: 'var(--c-gold)' },
    };
    const m = msgs[type] || msgs.honest;
    const panel = document.getElementById('summary-panel');
    const ov = document.getElementById('overlay-summary');
    ov.classList.remove('hidden');
    panel.innerHTML = `
      <div style="font-size:56px;margin-bottom:8px">🍕</div>
      <div style="font-size:24px;font-weight:700;font-family:Georgia,serif;color:${m.color};text-align:center;margin-bottom:10px">${m.title}</div>
      <div style="font-size:15px;color:var(--c-text);text-align:center;line-height:1.7;max-width:300px;margin-bottom:20px">${m.text}</div>
      <div class="summary-stats" style="width:88%;max-width:340px">
        <div class="summary-stat"><span>Pizzen gebacken</span><span>${S.stats.pizzasMade}</span></div>
        <div class="summary-stat"><span>Tage gespielt</span><span>${S.day}</span></div>
        <div class="summary-stat"><span>Gesamteinnahmen</span><span style="color:var(--c-gold)">${formatMoney(S.stats.totalEarned)}</span></div>
        <div class="summary-stat"><span>Endergebnis</span><span style="color:${m.color}">${m.title.split(':')[0]}</span></div>
      </div>
      <button class="btn btn-outline" style="width:88%;max-width:340px;margin-top:12px" onclick="Game.restartGame()">Neu starten</button>
    `;
  }

  function restartGame() {
    localStorage.removeItem(SAVE_KEY);
    document.getElementById('overlay-summary').classList.add('hidden');
    showTitleScreen();
  }

  // -------- SCREENS --------
  function showGameScreen() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-game').classList.add('active');
    // Inject tab icons
    document.querySelectorAll('.tab-ico').forEach(ico => {
      const name = ico.dataset.ico;
      if (Icons[name]) ico.innerHTML = Icons[name];
    });
    refillOrders();
    switchTab('service');
    updateHUD();
    save();
  }

  function showTitleScreen() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-title').classList.add('active');
    const hasSaved = hasSave();
    const btnContinue = document.getElementById('btn-continue');
    const saveInfo = document.getElementById('title-save-info');
    if (hasSaved) {
      const s = load();
      btnContinue.classList.remove('hidden');
      saveInfo.classList.remove('hidden');
      saveInfo.textContent = `Letzter Spielstand: Tag ${s.day} · ${formatMoney(s.money)}`;
    } else {
      btnContinue.classList.add('hidden');
      saveInfo.classList.add('hidden');
    }
    drawTitlePizza();
  }

  function drawTitlePizza() {
    const el = document.getElementById('title-pizza');
    if (el) el.innerHTML = buildPizzaSVG(['sauce','cheese','salami','basil','peppers'], 180);
  }

  // -------- INIT --------
  function init() {
    // Title screen buttons
    document.getElementById('btn-newgame').addEventListener('click', () => {
      newGame();
      Story.playChapter('intro', () => {});
    });
    document.getElementById('btn-continue').addEventListener('click', () => {
      loadGame();
      showGameScreen();
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Kitchen overlay buttons
    document.getElementById('btn-kitchen-bake').addEventListener('click', bake);
    document.getElementById('btn-kitchen-reset').addEventListener('click', () => { kitchenToppings = []; renderKitchen(); });
    document.getElementById('btn-kitchen-cancel').addEventListener('click', closeKitchen);

    // Story engine
    Story.init();

    // Start on title screen
    showTitleScreen();
  }

  return {
    init,
    applyEffect,
    setGangEvent,
    setPoliceEvent,
    showGameScreen,
    openKitchen,
    toggleTopping,
    buyIngredient,
    upgrade,
    hireStaff,
    endDay,
    nextDay,
    triggerGangStory,
    triggerEnding,
    restartGame,
  };
})();

// -------- HELPERS --------
function formatMoney(n) { return (Math.round(n || 0)).toLocaleString('de-DE') + ' €'; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function showToast(msg) {
  const wrap = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 2700);
}

// -------- BOOT --------
document.addEventListener('DOMContentLoaded', () => Game.init());
window.handleAndroidBack = () => {
  // Check what screen is visible and go back, or signal exit
  const summary = document.getElementById('overlay-summary');
  const kitchen = document.getElementById('overlay-kitchen');
  if (!summary.classList.contains('hidden')) { summary.classList.add('hidden'); return 'handled'; }
  if (!kitchen.classList.contains('hidden')) { kitchen.classList.add('hidden'); return 'handled'; }
  const title = document.getElementById('screen-title');
  if (title.classList.contains('active')) return 'exit';
  return 'handled';
};
