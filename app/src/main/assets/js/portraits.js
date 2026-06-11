// SVG portrait generator – all characters drawn as vector art
const Portraits = {

  // Player (young, dark hair, apron)
  player: () => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#1a1209"/>
    <!-- body / apron -->
    <ellipse cx="40" cy="72" rx="22" ry="14" fill="#C73E1D"/>
    <rect x="31" y="58" width="18" height="20" rx="4" fill="#E8E0D0"/>
    <!-- collar -->
    <polygon points="34,58 46,58 44,65 36,65" fill="#fff"/>
    <rect x="38" y="60" width="4" height="12" fill="#C73E1D"/>
    <!-- neck -->
    <rect x="36" y="50" width="8" height="10" rx="3" fill="#C8956A"/>
    <!-- head -->
    <ellipse cx="40" cy="36" rx="17" ry="19" fill="#C8956A"/>
    <!-- hair -->
    <ellipse cx="40" cy="20" rx="17" ry="10" fill="#2A1A08"/>
    <ellipse cx="28" cy="27" rx="7" ry="9" fill="#2A1A08"/>
    <ellipse cx="52" cy="27" rx="7" ry="9" fill="#2A1A08"/>
    <!-- eyes -->
    <ellipse cx="33" cy="36" rx="3.5" ry="4" fill="#fff"/>
    <ellipse cx="47" cy="36" rx="3.5" ry="4" fill="#fff"/>
    <circle cx="34" cy="37" r="2.5" fill="#3D2010"/>
    <circle cx="48" cy="37" r="2.5" fill="#3D2010"/>
    <circle cx="34.8" cy="36" r="1" fill="#fff"/>
    <circle cx="48.8" cy="36" r="1" fill="#fff"/>
    <!-- eyebrows -->
    <path d="M30 31 Q33.5 29 37 31" stroke="#2A1A08" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M43 31 Q46.5 29 50 31" stroke="#2A1A08" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <!-- nose -->
    <path d="M40 38 Q38 42 36 43 Q40 45 44 43 Q42 42 40 38" fill="#B07A50" opacity=".7"/>
    <!-- mouth -->
    <path d="M35 48 Q40 52 45 48" stroke="#A0603A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <!-- chef hat hint -->
    <rect x="26" y="17" width="28" height="6" rx="3" fill="#F0E8D8"/>
    <ellipse cx="40" cy="13" rx="11" ry="8" fill="#F0E8D8"/>
  </svg>`,

  // Nonna (old woman, grey hair, kind eyes)
  nonna: () => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#0d1a10"/>
    <ellipse cx="40" cy="72" rx="22" ry="14" fill="#3a5a3a"/>
    <rect x="30" y="56" width="20" height="20" rx="4" fill="#6B8C6B"/>
    <!-- scarf -->
    <ellipse cx="40" cy="58" rx="16" ry="6" fill="#8B3A3A"/>
    <!-- neck -->
    <rect x="36" y="48" width="8" height="10" rx="3" fill="#C8A080"/>
    <!-- head -->
    <ellipse cx="40" cy="35" rx="16" ry="18" fill="#C8A080"/>
    <!-- grey hair bun -->
    <ellipse cx="40" cy="20" rx="15" ry="9" fill="#B0A898"/>
    <ellipse cx="40" cy="14" rx="8" ry="7" fill="#B0A898"/>
    <!-- wrinkles -->
    <path d="M29 40 Q30 41 29 42" stroke="#A07858" stroke-width="1" fill="none"/>
    <path d="M51 40 Q50 41 51 42" stroke="#A07858" stroke-width="1" fill="none"/>
    <!-- eyes – warm, slightly squinted -->
    <ellipse cx="33" cy="35" rx="3" ry="3.5" fill="#fff"/>
    <ellipse cx="47" cy="35" rx="3" ry="3.5" fill="#fff"/>
    <circle cx="33.5" cy="36" r="2.2" fill="#5A3A20"/>
    <circle cx="47.5" cy="36" r="2.2" fill="#5A3A20"/>
    <circle cx="34.2" cy="35" r=".8" fill="#fff"/>
    <circle cx="48.2" cy="35" r=".8" fill="#fff"/>
    <!-- eyebrows – arched -->
    <path d="M30 30 Q33 28.5 36 30" stroke="#8A7868" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M44 30 Q47 28.5 50 30" stroke="#8A7868" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <!-- nose -->
    <circle cx="38.5" cy="41" r="1.2" fill="#A07858" opacity=".6"/>
    <circle cx="41.5" cy="41" r="1.2" fill="#A07858" opacity=".6"/>
    <!-- smile -->
    <path d="M34 46 Q40 51 46 46" stroke="#8A5538" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <!-- cheek blush -->
    <ellipse cx="29" cy="41" rx="4" ry="2.5" fill="#D08060" opacity=".3"/>
    <ellipse cx="51" cy="41" rx="4" ry="2.5" fill="#D08060" opacity=".3"/>
  </svg>`,

  // Marco (gang boss, scar, slicked hair)
  marco: () => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#1a0a0a"/>
    <!-- dark suit -->
    <rect x="20" y="56" width="40" height="24" rx="4" fill="#1A1A2A"/>
    <!-- shirt and tie -->
    <polygon points="34,56 46,56 43,66 37,66" fill="#e0d8c8"/>
    <polygon points="38,56 42,56 41,68 39,68" fill="#8B1A1A"/>
    <!-- neck -->
    <rect x="36" y="48" width="8" height="10" rx="3" fill="#B87858"/>
    <!-- head -->
    <ellipse cx="40" cy="35" rx="17" ry="19" fill="#B87858"/>
    <!-- slicked hair – very dark -->
    <ellipse cx="40" cy="19" rx="17" ry="9" fill="#0d0d0d"/>
    <path d="M23 26 Q30 20 40 18 Q50 20 57 26" fill="#0d0d0d"/>
    <!-- shadow under hair -->
    <path d="M25 26 Q30 24 40 23 Q50 24 55 26" stroke="#0d0d0d" stroke-width="3" fill="none"/>
    <!-- eyes – cold, narrow -->
    <ellipse cx="33" cy="36" rx="3.5" ry="3" fill="#fff"/>
    <ellipse cx="47" cy="36" rx="3.5" ry="3" fill="#fff"/>
    <circle cx="34" cy="36.5" r="2.4" fill="#1A0A0A"/>
    <circle cx="48" cy="36.5" r="2.4" fill="#1A0A0A"/>
    <circle cx="34.6" cy="35.6" r=".8" fill="#fff"/>
    <circle cx="48.6" cy="35.6" r=".8" fill="#fff"/>
    <!-- eyebrows – furrowed -->
    <path d="M29.5 30.5 Q33 29 36.5 30" stroke="#0d0d0d" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M43.5 30 Q47 29 50.5 30.5" stroke="#0d0d0d" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <!-- scar on left cheek -->
    <path d="M28 40 L31 47" stroke="#8A4A30" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <!-- nose – strong -->
    <path d="M40 38 Q38 43 36 44 Q40 46 44 44 Q42 43 40 38" fill="#9A6040" opacity=".65"/>
    <!-- neutral tight mouth -->
    <path d="M35 50 L45 50" stroke="#7A4028" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <!-- stubble hint -->
    <ellipse cx="40" cy="50" rx="10" ry="6" fill="#9A6040" opacity=".15"/>
  </svg>`,

  // Inspector Bauer (police officer, cap, moustache)
  bauer: () => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#0a0d1a"/>
    <!-- police uniform -->
    <rect x="20" y="56" width="40" height="24" rx="4" fill="#1A3060"/>
    <!-- badges -->
    <circle cx="32" cy="64" r="3" fill="#C8A820"/>
    <circle cx="32" cy="64" r="1.5" fill="#1A3060"/>
    <!-- collar / tie -->
    <polygon points="34,56 46,56 44,63 36,63" fill="#F0F0F0"/>
    <polygon points="38,56 42,56 41,64 39,64" fill="#1A3060"/>
    <!-- neck -->
    <rect x="36" y="48" width="8" height="10" rx="3" fill="#C09070"/>
    <!-- head -->
    <ellipse cx="40" cy="35" rx="16" ry="18" fill="#C09070"/>
    <!-- police cap -->
    <ellipse cx="40" cy="20" rx="18" ry="6" fill="#1A3060"/>
    <rect x="22" y="16" width="36" height="7" rx="2" fill="#1A3060"/>
    <ellipse cx="40" cy="16" rx="12" ry="5" fill="#243A78"/>
    <!-- cap badge -->
    <polygon points="40,13 42,17 46,17 43,19 44,23 40,21 36,23 37,19 34,17 38,17" fill="#C8A820" transform="scale(.55) translate(32,12)"/>
    <!-- cap brim -->
    <ellipse cx="40" cy="23" rx="19" ry="4" fill="#12285A"/>
    <!-- eyes – sharp -->
    <ellipse cx="33" cy="35" rx="3.5" ry="3.8" fill="#fff"/>
    <ellipse cx="47" cy="35" rx="3.5" ry="3.8" fill="#fff"/>
    <circle cx="33.5" cy="36" r="2.5" fill="#3A2A18"/>
    <circle cx="47.5" cy="36" r="2.5" fill="#3A2A18"/>
    <circle cx="34.3" cy="35" r=".9" fill="#fff"/>
    <circle cx="48.3" cy="35" r=".9" fill="#fff"/>
    <!-- eyebrows -->
    <path d="M29.5 29.5 Q33 28 36.5 29.5" stroke="#3A2818" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M43.5 29.5 Q47 28 50.5 29.5" stroke="#3A2818" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- moustache -->
    <path d="M34 45 Q37 47 40 46 Q43 47 46 45" stroke="#5A3A20" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- nose -->
    <path d="M40 38 Q37.5 43 35.5 44" stroke="#A07858" stroke-width="1.4" fill="none"/>
    <path d="M40 38 Q42.5 43 44.5 44" stroke="#A07858" stroke-width="1.4" fill="none"/>
  </svg>`,

  // Rosa (cheerful waitress, red hair)
  rosa: () => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#1a0d12"/>
    <ellipse cx="40" cy="72" rx="22" ry="14" fill="#C73E1D"/>
    <rect x="30" y="56" width="20" height="20" rx="4" fill="#F0E8D0"/>
    <polygon points="34,56 46,56 44,64 36,64" fill="#C73E1D"/>
    <!-- neck -->
    <rect x="36" y="48" width="8" height="10" rx="3" fill="#E0A878"/>
    <!-- head -->
    <ellipse cx="40" cy="35" rx="16" ry="18" fill="#E0A878"/>
    <!-- red hair – big wavy -->
    <ellipse cx="40" cy="19" rx="17" ry="11" fill="#B83A10"/>
    <ellipse cx="24" cy="32" rx="8" ry="13" fill="#B83A10"/>
    <ellipse cx="56" cy="32" rx="8" ry="13" fill="#B83A10"/>
    <ellipse cx="40" cy="14" rx="10" ry="8" fill="#C8461A"/>
    <!-- cheek blush -->
    <ellipse cx="29" cy="40" rx="5" ry="3" fill="#E07850" opacity=".4"/>
    <ellipse cx="51" cy="40" rx="5" ry="3" fill="#E07850" opacity=".4"/>
    <!-- eyes – big, happy -->
    <ellipse cx="33" cy="35" rx="4" ry="4.5" fill="#fff"/>
    <ellipse cx="47" cy="35" rx="4" ry="4.5" fill="#fff"/>
    <circle cx="33.5" cy="36" r="3" fill="#3A1A08"/>
    <circle cx="47.5" cy="36" r="3" fill="#3A1A08"/>
    <circle cx="34.5" cy="34.8" r="1.1" fill="#fff"/>
    <circle cx="48.5" cy="34.8" r="1.1" fill="#fff"/>
    <!-- eyelashes top -->
    <path d="M29 32 Q30 30 33 31" stroke="#3A1A08" stroke-width="1" fill="none"/>
    <path d="M45 31 Q48 30 51 32" stroke="#3A1A08" stroke-width="1" fill="none"/>
    <!-- eyebrows – curved up -->
    <path d="M29.5 29 Q33 27 36.5 29" stroke="#8A3A10" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M43.5 29 Q47 27 50.5 29" stroke="#8A3A10" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <!-- nose -->
    <circle cx="38.5" cy="41" r="1.3" fill="#C08050" opacity=".5"/>
    <circle cx="41.5" cy="41" r="1.3" fill="#C08050" opacity=".5"/>
    <!-- big smile -->
    <path d="M33 47 Q40 54 47 47" stroke="#9A4A28" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- teeth -->
    <path d="M34.5 48.5 Q40 52 45.5 48.5" fill="#fff"/>
  </svg>`,

  // Unknown / silhouette
  unknown: () => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#0d0d0d"/>
    <circle cx="40" cy="30" r="14" fill="#1a1a1a"/>
    <ellipse cx="40" cy="70" rx="22" ry="18" fill="#1a1a1a"/>
    <text x="40" y="36" font-size="20" text-anchor="middle" fill="#3a3a3a">?</text>
  </svg>`,
};

// Tab icons as SVG
const Icons = {
  oven: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/>
    <rect x="5" y="9" width="14" height="9" rx="2" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="1.4"/>
    <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
    <circle cx="12" cy="7" r="1.2" fill="currentColor"/>
    <circle cx="17" cy="7" r="1.2" fill="currentColor"/>
    <path d="M8 13.5 Q12 11 16 13.5" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  </svg>`,
  cart: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3h2l2.5 11h10l2-7H7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="10" cy="19" r="1.8" fill="currentColor"/>
    <circle cx="17" cy="19" r="1.8" fill="currentColor"/>
  </svg>`,
  hammer: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 6l-8.5 8.5 1.5 1.5L16.5 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <rect x="14" y="3" width="7" height="5" rx="1.5" transform="rotate(45 17.5 5.5)" fill="currentColor" opacity=".8"/>
    <path d="M5.5 16.5 L4 18 L6 20 L7.5 18.5" fill="currentColor" opacity=".6"/>
  </svg>`,
  ledger: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="2" width="14" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/>
    <path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="15" y="14" width="5" height="8" rx="1" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="1.4"/>
    <path d="M17.5 17v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M16 18.5h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,
};

// Ingredient SVG icons
const IngredientIcons = {
  sauce: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="22" rx="14" ry="10" fill="#C73E1D"/>
    <ellipse cx="20" cy="20" rx="12" ry="8" fill="#E05030"/>
    <ellipse cx="20" cy="19" rx="8" ry="5" fill="#E86040" opacity=".7"/>
  </svg>`,
  cheese: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <polygon points="4,30 20,8 36,30" fill="#F5C542"/>
    <polygon points="4,30 20,8 36,30" fill="#F5C542"/>
    <ellipse cx="14" cy="22" rx="3" ry="3" fill="#E8A820"/>
    <ellipse cx="26" cy="24" rx="2.5" ry="2.5" fill="#E8A820"/>
    <ellipse cx="20" cy="17" rx="2" ry="2" fill="#E8A820"/>
  </svg>`,
  salami: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="14" fill="#B5301F"/>
    <circle cx="20" cy="20" r="11" fill="#C73E2A"/>
    <circle cx="15" cy="16" r="2" fill="#8B1A0A"/>
    <circle cx="25" cy="18" r="2" fill="#8B1A0A"/>
    <circle cx="18" cy="25" r="2" fill="#8B1A0A"/>
    <circle cx="26" cy="25" r="1.5" fill="#8B1A0A"/>
  </svg>`,
  mushrooms: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8 Q10 8 10 18 Q10 22 15 22 L15 30 L25 30 L25 22 Q30 22 30 18 Q30 8 20 8Z" fill="#B8A878"/>
    <path d="M10 18 Q14 14 20 13 Q26 14 30 18" fill="#8A7848" opacity=".5"/>
    <circle cx="16" cy="14" r="2" fill="#8A7848" opacity=".4"/>
    <circle cx="24" cy="13" r="1.5" fill="#8A7848" opacity=".4"/>
  </svg>`,
  peppers: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8 Q22 10 22 14 L28 22 Q28 30 22 32 L20 33 L18 32 Q12 30 12 22 L18 14 Q18 10 20 8Z" fill="#E03A20"/>
    <path d="M20 8 Q21 10 20 14" stroke="#CC2A10" stroke-width="1" fill="none"/>
    <path d="M18 15 Q14 22 15 29" stroke="#CC2A10" stroke-width="1" fill="none"/>
    <circle cx="20" cy="7" r="2" fill="#3E8A30"/>
    <path d="M20 5 Q24 3 26 5" stroke="#3E8A30" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </svg>`,
  olives: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="22" rx="12" ry="10" fill="#3E5A3A"/>
    <ellipse cx="20" cy="20" rx="10" ry="8" fill="#4A6A45"/>
    <ellipse cx="20" cy="19" rx="5" ry="4" fill="#E05030"/>
    <circle cx="20" cy="18" r="2" fill="#C8401A"/>
  </svg>`,
  basil: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 32 Q14 26 10 18 Q8 10 16 10 Q20 10 20 16 Q20 10 24 10 Q32 10 30 18 Q26 26 20 32Z" fill="#3E7A30"/>
    <path d="M20 32 Q14 26 10 18" stroke="#2A5A20" stroke-width="1" fill="none"/>
    <path d="M20 32 Q26 26 30 18" stroke="#2A5A20" stroke-width="1" fill="none"/>
    <path d="M20 16 Q16 12 12 14" stroke="#5A9A40" stroke-width="1" fill="none"/>
    <path d="M20 16 Q24 12 28 14" stroke="#5A9A40" stroke-width="1" fill="none"/>
  </svg>`,
  pineapple: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="24" rx="10" ry="12" fill="#F5C542"/>
    <!-- scales -->
    <path d="M15 18 Q20 15 25 18" stroke="#E8A820" stroke-width="1.2" fill="none"/>
    <path d="M13 22 Q20 19 27 22" stroke="#E8A820" stroke-width="1.2" fill="none"/>
    <path d="M14 26 Q20 23 26 26" stroke="#E8A820" stroke-width="1.2" fill="none"/>
    <!-- leaves -->
    <path d="M20 12 Q17 6 14 8 Q16 10 18 12" fill="#3E7A30"/>
    <path d="M20 12 Q20 5 20 8 Q20 9 20 12" fill="#3E8A30"/>
    <path d="M20 12 Q23 6 26 8 Q24 10 22 12" fill="#3E7A30"/>
  </svg>`,
  dough: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="22" rx="16" ry="12" fill="#F0D890"/>
    <ellipse cx="20" cy="20" rx="13" ry="9" fill="#F5E0A0"/>
    <!-- dough texture -->
    <path d="M12 20 Q16 18 20 20 Q24 22 28 20" stroke="#E0C870" stroke-width="1" fill="none"/>
    <path d="M14 24 Q18 22 22 24 Q25 25 27 23" stroke="#E0C870" stroke-width=".8" fill="none"/>
  </svg>`,
};

// Pizza viewer SVG (builds up based on toppings array)
function buildPizzaSVG(toppings = [], size = 160) {
  const r = size / 2;
  const cx = r, cy = r;
  let svgContent = `<circle cx="${cx}" cy="${cy}" r="${r-2}" fill="#D98A3D"/>`;
  svgContent += `<circle cx="${cx}" cy="${cy}" r="${r*0.85}" fill="#F5E0A0"/>`;
  if (toppings.includes('sauce')) {
    svgContent += `<circle cx="${cx}" cy="${cy}" r="${r*0.78}" fill="#C73E1D" opacity=".85"/>`;
  }
  if (toppings.includes('cheese')) {
    svgContent += `<circle cx="${cx}" cy="${cy}" r="${r*0.75}" fill="#F5C542" opacity=".8"/>`;
    // cheese blobs
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const bx = cx + Math.cos(angle) * r * 0.4;
      const by = cy + Math.sin(angle) * r * 0.4;
      svgContent += `<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${r*0.12}" ry="${r*0.1}" fill="#F5D030" opacity=".7"/>`;
    }
  }
  // toppings scatter
  const toppingColors = { salami:'#B5301F', mushrooms:'#B8A878', peppers:'#E03A20', olives:'#3E5A3A', basil:'#3E7A30', pineapple:'#F5C542' };
  const toppingList = toppings.filter(t => t in toppingColors);
  toppingList.forEach((topping, ti) => {
    const color = toppingColors[topping];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = ((i / count) + ti * 0.17) * Math.PI * 2;
      const dist = r * (0.3 + (i % 2) * 0.22);
      const bx = cx + Math.cos(angle) * dist;
      const by = cy + Math.sin(angle) * dist;
      const brad = r * 0.09;
      svgContent += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${brad}" fill="${color}" opacity=".9"/>`;
    }
  });
  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
}

// Small pizza thumbnail (for order queue)
function pizzaThumb(type) {
  const recipes = {
    margherita: ['sauce','cheese','basil'],
    salami: ['sauce','cheese','salami'],
    veggie: ['sauce','cheese','peppers','mushrooms','olives'],
    hawaii: ['sauce','cheese','pineapple'],
    special: ['sauce','cheese','salami','peppers','mushrooms'],
  };
  return buildPizzaSVG(recipes[type] || recipes.margherita, 46);
}
