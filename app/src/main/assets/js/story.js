// ============================================
// PIZZA EMPIRE – STORY ENGINE
// ============================================

const STORY_CHAPTERS = [

  // ========== KAPITEL 1: DER ERBE ==========
  {
    id: 'intro',
    title: 'Kapitel 1 – Der Erbe',
    bg: 'linear-gradient(180deg,#1a0a04 0%,#0d0604 100%)',
    scenes: [
      {
        speaker: 'Notar',
        portrait: 'unknown',
        text: 'Herr… äh… Signore Russo? Ich möchte Ihnen mitteilen, dass Ihr Onkel Giovanni Ihnen seinen Pizzaladen in der Via Napoli 7 hinterlassen hat.',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: '…Was? Ich dachte, der Laden läuft nicht mehr. Onkel Giovanni hat nie viel darüber geredet.',
      },
      {
        speaker: 'Notar',
        portrait: 'unknown',
        text: 'Äh… ja, nun. Er läuft tatsächlich… nicht mehr. Sie finden ihn in einem recht… besonderen Zustand. Viel Erfolg.',
      },
      {
        speaker: 'Nonna',
        portrait: 'nonna',
        text: 'Bambino! Du bist endlich da! Schau dir das an – kaputte Öfen, Schimmel an der Wand, und die Kasse ist leer. Aber ich habe noch mein Rezeptbuch!',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: 'Nonna… du bist noch hier? Hast du die ganze Zeit auf den Laden aufgepasst?',
      },
      {
        speaker: 'Nonna',
        portrait: 'nonna',
        text: 'Aufgepasst ist das falsche Wort. Überlebt, mein Schatz. Aber mit dir wird das hier wieder ein echtes Stück Neapel. Los, fang an aufzuräumen!',
      },
    ],
    next: 'first_day',
    gotoGame: true,
  },

  // ========== GANG TAUCHT AUF ==========
  {
    id: 'gang_intro',
    title: 'Kapitel 2 – Ungebetene Gäste',
    bg: 'linear-gradient(180deg,#1a0404 0%,#080204 100%)',
    scenes: [
      {
        speaker: 'Marco',
        portrait: 'marco',
        text: '...\n*Drei Männer betreten den Laden kurz vor der Schließzeit. Der Größte legt einen Umschlag auf die Theke.*',
      },
      {
        speaker: 'Marco',
        portrait: 'marco',
        text: 'Schöner Laden. Dein Onkel und ich hatten eine… Vereinbarung. Jetzt hast du geerbt – also gilt sie auch für dich.',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: 'Welche Vereinbarung? Was ist das für ein Umschlag?',
      },
      {
        speaker: 'Marco',
        portrait: 'marco',
        text: 'Nennen wir es: Schutzgebühren. 500 € am ersten jeden Monat. Dafür läuft dein Laden reibungslos. Kein Feuer, keine Inspektion, keine Probleme.',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: '…',
      },
    ],
    choices: [
      {
        label: 'Zahlen und schweigen',
        tag: 'gang',
        tagClass: 'choice-gang',
        desc: 'Du nimmst den Umschlag. Vielleicht ist das vorerst der einfachste Weg.',
        effect: { gangTrust: +2, policeSuspicion: 0, morality: -1 },
        next: 'gang_paid',
      },
      {
        label: 'Ablehnen – direkt',
        tag: 'ehrlich',
        tagClass: 'choice-honest',
        desc: 'Du willst keine krummen Dinge.',
        effect: { gangTrust: -2, policeSuspicion: 0, morality: +2 },
        next: 'gang_refused',
      },
      {
        label: 'Zeit kaufen',
        tag: 'clever',
        tagClass: 'choice-clever',
        desc: '\"Ich brauche eine Nacht zum Nachdenken.\"',
        effect: { gangTrust: 0, policeSuspicion: 0, morality: 0 },
        next: 'gang_stall',
      },
    ],
  },

  {
    id: 'gang_paid',
    title: 'Kapitel 2 – Eine schmutzige Hand',
    bg: 'linear-gradient(180deg,#1a0404 0%,#080204 100%)',
    scenes: [
      {
        speaker: 'Marco',
        portrait: 'marco',
        text: 'Kluge Entscheidung. Wir kümmern uns um alles. Dein Onkel wusste das auch zu schätzen.',
      },
      {
        speaker: 'Nonna',
        portrait: 'nonna',
        text: '*Flüstert* Bambino… ich hoffe, du weißt was du tust. Giovanni hat auch gedacht, das ist nur vorübergehend…',
      },
    ],
    gotoGame: true,
    gangEvent: 'paid',
  },
  {
    id: 'gang_refused',
    title: 'Kapitel 2 – Rückgrat',
    bg: 'linear-gradient(180deg,#1a0404 0%,#080204 100%)',
    scenes: [
      {
        speaker: 'Marco',
        portrait: 'marco',
        text: 'Interessant. Dein Onkel war… kooperativer. Ich komme wieder. Überleg es dir.',
      },
      {
        speaker: 'Nonna',
        portrait: 'nonna',
        text: 'Brava! Aber pass auf dich auf, mein Schatz. Diese Männer scherzen nicht.',
      },
    ],
    gotoGame: true,
    gangEvent: 'refused',
  },
  {
    id: 'gang_stall',
    title: 'Kapitel 2 – Aufschub',
    bg: 'linear-gradient(180deg,#1a0404 0%,#080204 100%)',
    scenes: [
      {
        speaker: 'Marco',
        portrait: 'marco',
        text: 'Eine Nacht. Nicht mehr. Ich schätze keine… Unentschlossenheit.',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: 'Ich brauche nur etwas Zeit, um die Bücher zu prüfen.',
      },
    ],
    gotoGame: true,
    gangEvent: 'stall',
  },

  // ========== POLIZEI ==========
  {
    id: 'police_intro',
    title: 'Kapitel 3 – Inspektor Bauer',
    bg: 'linear-gradient(180deg,#040d1a 0%,#020608 100%)',
    scenes: [
      {
        speaker: 'Inspektor Bauer',
        portrait: 'bauer',
        text: 'Guten Tag. Inspektor Bauer, Sonderdezernat organisierte Kriminalität. Darf ich reinkommen?',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: 'Ja, natürlich. Ist etwas passiert?',
      },
      {
        speaker: 'Inspektor Bauer',
        portrait: 'bauer',
        text: 'Wir ermitteln seit zwei Jahren gegen die Russoni-Gruppe. Ihr Onkel hat damals – nennen wir es – mitgespielt. Ich wollte wissen, ob Sie Kontakt zu einem gewissen Marco Russoni hatten.',
      },
    ],
    choices: [
      {
        label: 'Alles sagen',
        tag: 'ehrlich',
        tagClass: 'choice-honest',
        desc: 'Du erzählst Bauer von Marcos Besuch.',
        effect: { gangTrust: -3, policeTrust: +3, morality: +2 },
        next: 'police_info',
      },
      {
        label: 'Nichts wissen',
        tag: 'schweigen',
        tagClass: 'choice-gang',
        desc: 'Du gibst nichts preis.',
        effect: { gangTrust: +1, policeTrust: -1, morality: -1 },
        next: 'police_silent',
      },
      {
        label: 'Beide täuschen',
        tag: 'clever',
        tagClass: 'choice-clever',
        desc: 'Du spielst Zeit und gibst Bauer falsche Fährten.',
        effect: { gangTrust: 0, policeTrust: 0, morality: -1 },
        next: 'police_deceive',
      },
    ],
  },

  {
    id: 'police_info',
    title: 'Kapitel 3 – Zeuge',
    bg: 'linear-gradient(180deg,#040d1a 0%,#020608 100%)',
    scenes: [
      {
        speaker: 'Inspektor Bauer',
        portrait: 'bauer',
        text: 'Das ist mutig von Ihnen. Ich kann Ihnen keinen offiziellen Schutz versprechen, aber wir haben ein Auge auf Marco. Ich melde mich.',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: 'Hoffentlich war das die richtige Entscheidung…',
      },
    ],
    gotoGame: true,
    policeEvent: 'info',
  },
  {
    id: 'police_silent',
    title: 'Kapitel 3 – Mauern',
    bg: 'linear-gradient(180deg,#040d1a 0%,#020608 100%)',
    scenes: [
      {
        speaker: 'Inspektor Bauer',
        portrait: 'bauer',
        text: 'Verstehe. Hier ist meine Karte. Falls Sie sich doch erinnern sollten.',
      },
      {
        speaker: 'Nonna',
        portrait: 'nonna',
        text: '…Bambino, ich hoffe, du machst das richtig.',
      },
    ],
    gotoGame: true,
    policeEvent: 'silent',
  },
  {
    id: 'police_deceive',
    title: 'Kapitel 3 – Doppeltes Spiel',
    bg: 'linear-gradient(180deg,#040d1a 0%,#020608 100%)',
    scenes: [
      {
        speaker: 'Inspektor Bauer',
        portrait: 'bauer',
        text: 'Interessant. Ich überprüfe das. Für Ihre eigene Sicherheit: spielen Sie kein doppeltes Spiel. Das endet selten gut.',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: '*Lächle ruhig* Ich weiß nicht wovon Sie reden, Inspektor.',
      },
    ],
    gotoGame: true,
    policeEvent: 'deceive',
  },

  // ========== FINALE-SETUP ==========
  {
    id: 'final_decision',
    title: 'Finale – Die Wahrheit',
    bg: 'linear-gradient(180deg,#1a0d00 0%,#080402 100%)',
    scenes: [
      {
        speaker: 'Marco',
        portrait: 'marco',
        text: 'Die Zeit läuft ab. Der Laden floriert – das haben wir möglich gemacht. Jetzt ist es Zeit, tiefer einzusteigen. Wir brauchen eine saubere Fassade für… gewisse Transaktionen.',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: 'Ich habe von Anfang an gewusst, dass dieser Moment kommt. Was jetzt?',
      },
    ],
    choices: [
      {
        label: 'Mit der Gang gehen',
        tag: 'gang',
        tagClass: 'choice-gang',
        desc: 'Du wirst Teil von Marcos Imperium.',
        effect: { gangTrust: +5, morality: -5 },
        ending: 'gang',
      },
      {
        label: 'Polizei anrufen',
        tag: 'ehrlich',
        tagClass: 'choice-police',
        desc: 'Inspektor Bauer bekommt alles.',
        effect: { policeTrust: +5, morality: +5 },
        ending: 'police',
      },
      {
        label: 'Alles selbst lösen',
        tag: 'clever',
        tagClass: 'choice-clever',
        desc: 'Du hast einen Plan. Du täuschst beide Seiten und eröffnest woanders.',
        effect: { morality: 0 },
        ending: 'empire',
      },
    ],
  },

  // ========== ENDINGS ==========
  {
    id: 'ending_honest',
    title: 'Ende 1 – Restaurant-König',
    bg: 'linear-gradient(180deg,#0a1a0a 0%,#040804 100%)',
    scenes: [
      {
        speaker: 'Nonna',
        portrait: 'nonna',
        text: 'Sieh dir das an, Bambino. Fünf Sterne. Eine Warteschlange bis zur Ecke. Und kein Schatten über uns.',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: 'Es war nicht einfach. Aber es war ehrlich. Das zählt.',
      },
      {
        speaker: 'Nonna',
        portrait: 'nonna',
        text: 'Giovanni wäre stolz. Auf die alte Art, meine ich.',
      },
    ],
    ending: 'honest',
  },
  {
    id: 'ending_gang',
    title: 'Ende 2 – Das Kartell-Restaurant',
    bg: 'linear-gradient(180deg,#1a0404 0%,#080202 100%)',
    scenes: [
      {
        speaker: 'Marco',
        portrait: 'marco',
        text: 'Perfekt. Via Napoli 7 ist jetzt unsere Zentrale. Du hast gut gemacht.',
      },
      {
        speaker: 'Nonna',
        portrait: 'nonna',
        text: '…*leise* Giovanni hat auch so gedacht. Und weißt du, was mit ihm passiert ist?',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: '…\n\n*Das Licht erlischt.*',
      },
    ],
    ending: 'gang',
  },
  {
    id: 'ending_police',
    title: 'Ende 3 – Die Razzia',
    bg: 'linear-gradient(180deg,#040d1a 0%,#020408 100%)',
    scenes: [
      {
        speaker: 'Inspektor Bauer',
        portrait: 'bauer',
        text: 'Danke für Ihre Zusammenarbeit. Marco Russoni und acht weitere sind verhaftet. Via Napoli 7 ist wieder sauber.',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: 'Und der Laden?',
      },
      {
        speaker: 'Inspektor Bauer',
        portrait: 'bauer',
        text: 'Gehört Ihnen. Viel Erfolg, Signore.',
      },
    ],
    ending: 'police',
  },
  {
    id: 'ending_empire',
    title: 'Ende 4 – Das Weltreich',
    bg: 'linear-gradient(180deg,#1a0e00 0%,#080502 100%)',
    scenes: [
      {
        speaker: 'Du',
        portrait: 'player',
        text: 'Während Marco wartete und Bauer ermittelte, habe ich das Geld gerettet, die Rezepte gesichert und nachts den Laden verlassen. Zwei Monate später: Pizza Empire – Berlin, Wien, Zürich.',
      },
      {
        speaker: 'Nonna',
        portrait: 'nonna',
        text: 'Tre ristoranti! Mein Gott! Aber vergiss nicht, wer die Rezepte hatte!',
      },
      {
        speaker: 'Du',
        portrait: 'player',
        text: 'Niemals, Nonna. Niemals.',
      },
    ],
    ending: 'empire',
  },

  // ========== GANG MISSIONEN ==========
  {
    id: 'gang_mission_1',
    title: 'Kapitel 4 – Der erste Auftrag',
    bg: 'linear-gradient(180deg,#1a0404 0%,#080202 100%)',
    scenes: [
      { speaker:'Marco', portrait:'marco', text:'Du hast Talent, das muss ich zugeben. Ich habe einen kleinen Auftrag. Eine Tasche wird gebracht. Du gibst sie weiter. Keine Fragen.' },
      { speaker:'Du', portrait:'player', text:'Eine Tasche. Und wenn ich frage, was drin ist?' },
      { speaker:'Marco', portrait:'marco', text:'Dann stellen wir fest, ob du klug bist. 300 € für zwanzig Minuten Arbeit. Entscheid dich.' },
    ],
    choices: [
      { label:'Annehmen', tag:'gang', tagClass:'choice-gang', desc:'Du nimmst den Auftrag. Das Geld ist verlockend.', effect:{ gangTrust:+2, morality:-2, money:300 }, next:'gang_mission_1_done' },
      { label:'Ablehnen', tag:'ehrlich', tagClass:'choice-honest', desc:'Das geht zu weit.', effect:{ gangTrust:-1, morality:+1 }, gotoGame:true },
    ],
  },
  {
    id:'gang_mission_1_done',
    title:'Kapitel 4 – Erledigt',
    bg:'linear-gradient(180deg,#1a0404 0%,#080202 100%)',
    scenes:[
      { speaker:'Marco', portrait:'marco', text:'Sauber. Kein Drama, kein Chaos. Genau wie ich es mag. Du bist nützlich.' },
      { speaker:'Nonna', portrait:'nonna', text:'*flüstert* Bambino… ich habe gesehen, was du übergeben hast. Ich frage nicht. Aber sei vorsichtig.' },
    ],
    gotoGame:true, gangEvent:'mission1_done',
  },

  {
    id:'gang_mission_2',
    title:'Kapitel 4 – Tiefer rein',
    bg:'linear-gradient(180deg,#1a0404 0%,#080202 100%)',
    scenes:[
      { speaker:'Marco', portrait:'marco', text:'Der nächste Schritt. Unter deinem Laden – genauer unter dem Büro – gibt es einen Keller. Dein Onkel hat ihn gebaut. Zeit, ihn zu nutzen.' },
      { speaker:'Du', portrait:'player', text:'Was? Ein Keller? Ich wusste nichts davon.' },
      { speaker:'Marco', portrait:'marco', text:'Giovanni hat vieles vor dir geheimgehalten. Geh in dein Büro. Schau hinter den Aktenschrank. Die Kombination ist 4-7-2.' },
      { speaker:'Nonna', portrait:'nonna', text:'*erschrocken* Der Keller… Bambino, das wollte ich dir nie zeigen müssen.' },
    ],
    gotoGame:true, storyFlag:'lab_unlocked', gangEvent:'lab_revealed',
  },

  {
    id:'gang_mission_3',
    title:'Kapitel 5 – Das Netz',
    bg:'linear-gradient(180deg,#1a0404 0%,#080202 100%)',
    scenes:[
      { speaker:'Marco', portrait:'marco', text:'La Famiglia Bar ist unsere Zentrale. Komm heute Nacht dorthin. Ich stelle dich den anderen vor.' },
      { speaker:'Du', portrait:'player', text:'Den anderen?' },
      { speaker:'Marco', portrait:'marco', text:'Wir sind keine kleinen Fische. Russoni kontrolliert fünf Bezirke. Du bist jetzt Teil davon. Oder du bist ein Problem.' },
    ],
    choices:[
      { label:'Zur Bar gehen', tag:'gang', tagClass:'choice-gang', desc:'Du wirst offiziell Teil der Russoni-Organisation.', effect:{ gangTrust:+3, morality:-3 }, next:'gang_official' },
      { label:'Jetzt reicht es', tag:'ehrlich', tagClass:'choice-honest', desc:'Das ist zu weit gegangen.', effect:{ morality:+2, gangTrust:-3 }, next:'gang_escape_plan' },
    ],
  },
  {
    id:'gang_official',
    title:'Kapitel 5 – Parte della Famiglia',
    bg:'linear-gradient(180deg,#1a0404 0%,#080202 100%)',
    scenes:[
      { speaker:'Marco', portrait:'marco', text:'Willkommen, fratello. Ab heute läuft das Geld durch deinen Laden. Niemand fragt, woher es kommt.' },
      { speaker:'Du', portrait:'player', text:'Wie viel weiß die Polizei?' },
      { speaker:'Marco', portrait:'marco', text:'Bauer? Den haben wir im Griff. Mach dir keine Sorgen.' },
    ],
    gotoGame:true, gangEvent:'official_member',
  },
  {
    id:'gang_escape_plan',
    title:'Kapitel 5 – Der Ausweg',
    bg:'linear-gradient(180deg,#1a0404 0%,#080202 100%)',
    scenes:[
      { speaker:'Du', portrait:'player', text:'Ich muss hier raus. Aber wie? Marco hat Leute überall.' },
      { speaker:'Nonna', portrait:'nonna', text:'Inspektor Bauer. Er hat mir seine Karte gegeben. Er will doch helfen, oder?' },
      { speaker:'Du', portrait:'player', text:'Wenn ich zu ihm gehe, ist kein Zurück mehr möglich.' },
      { speaker:'Nonna', portrait:'nonna', text:'Manchmal gibt es keinen Rückweg, Bambino. Nur nach vorne.' },
    ],
    gotoGame:true, storyFlag:'escape_planned',
  },

  // ========== POLIZEI MISSIONEN ==========
  {
    id:'police_mission_1',
    title:'Kapitel 4 – Kronzeuge',
    bg:'linear-gradient(180deg,#040d1a 0%,#020608 100%)',
    scenes:[
      { speaker:'Inspektor Bauer', portrait:'bauer', text:'Sie haben Mut bewiesen, zur Polizei zu kommen. Ich brauche Ihre Hilfe. Beobachten Sie La Famiglia Bar. Wann kommen die Männer? Wie viele?' },
      { speaker:'Du', portrait:'player', text:'Sie wollen mich als Spitzel.' },
      { speaker:'Inspektor Bauer', portrait:'bauer', text:'Als Zeugen. Großer Unterschied. Und wenn es vorbei ist, läuft Ihr Laden ohne Schatten. Versprochen.' },
    ],
    choices:[
      { label:'Helfen', tag:'polizei', tagClass:'choice-police', desc:'Du wirst Bauers Informant.', effect:{ policeTrust:+3, gangTrust:-2, morality:+2 }, next:'police_mission_1_done' },
      { label:'Ablehnen', tag:'clever', tagClass:'choice-clever', desc:'Zu riskant.', effect:{ policeTrust:-1 }, gotoGame:true },
    ],
  },
  {
    id:'police_mission_1_done',
    title:'Kapitel 4 – Informationen',
    bg:'linear-gradient(180deg,#040d1a 0%,#020608 100%)',
    scenes:[
      { speaker:'Inspektor Bauer', portrait:'bauer', text:'Gut. Donnerstag Nacht. Sieben Männer. Das reicht für einen Haftbefehl. Sie haben uns sehr geholfen.' },
      { speaker:'Du', portrait:'player', text:'Weiß Marco, wer Sie informiert hat?' },
      { speaker:'Inspektor Bauer', portrait:'bauer', text:'Nicht wenn wir es richtig machen. Verhalten Sie sich normal. Ich melde mich.' },
    ],
    gotoGame:true, policeEvent:'informant',
  },

  // ========== FRITZE DER ALTE MANN ==========
  {
    id:'fritz_secret',
    title:'Ein alter Bekannter',
    bg:'linear-gradient(180deg,#1a1a0a 0%,#0d0d04 100%)',
    scenes:[
      { speaker:'Alter Fritz', portrait:'unknown', text:'Du bist Giovannis Neffe, oder? Ich erkenne die Augen. Er hat mir mal das Leben gerettet, weißt du.' },
      { speaker:'Du', portrait:'player', text:'Was? Wie?' },
      { speaker:'Alter Fritz', portrait:'unknown', text:'Lange Geschichte. Aber ich schulde ihm etwas. Und jetzt – schau mal unter der Parkbank. Hinten links. Dein Onkel hat mir das zur Aufbewahrung gegeben.' },
      { speaker:'Du', portrait:'player', text:'*findet einen kleinen Schlüssel mit Anhänger: \"VN7-K\"*' },
      { speaker:'Alter Fritz', portrait:'unknown', text:'Keine Ahnung was es ist. Aber er sagte, du weißt es wenn du es brauchst.' },
    ],
    gotoGame:true, storyFlag:'key_found',
  },

  // ========== BOSS ROMANO (Oberboss) ==========
  {
    id:'romano_intro',
    title:'Kapitel 6 – Der echte Boss',
    bg:'linear-gradient(180deg,#1a0404 0%,#050104 100%)',
    scenes:[
      { speaker:'Romano', portrait:'unknown', text:'*Schwere Schritte. Ein älterer Mann in teuren Kleidern betritt den Laden nach Geschäftsschluss.*\nSignore Russo. Ich bin Romano. Marco arbeitet für mich.' },
      { speaker:'Du', portrait:'player', text:'…Wer sind Sie?' },
      { speaker:'Romano', portrait:'unknown', text:'Der Mann, dem diese Stadt gehört. Ich habe deinen Onkel gekannt. Er war loyal. Bis er es nicht mehr war. Das war sein Fehler.' },
      { speaker:'Nonna', portrait:'nonna', text:'*flüstert* Madonna...' },
      { speaker:'Romano', portrait:'unknown', text:'Du hast eine Wahl. Schließ dich uns an – richtig, nicht als Mittelmann. Oder verschwinde aus dieser Stadt. Ganz.' },
    ],
    choices:[
      { label:'Romano dienen', tag:'gang', tagClass:'choice-gang', desc:'Du stiegst auf – bis ganz nach oben ins Kartell.', effect:{ gangTrust:+5, morality:-5 }, ending:'gang' },
      { label:'Ablehnen und fliehen', tag:'ehrlich', tagClass:'choice-honest', desc:'Du rufst Bauer an. Jetzt, sofort.', effect:{ policeTrust:+5, morality:+3 }, ending:'police' },
      { label:'Romano überlisten', tag:'clever', tagClass:'choice-clever', desc:'Du spielst mit, aber hast einen Plan.', effect:{ morality:0 }, ending:'empire' },
    ],
  },
];

// Story Engine
const Story = (() => {
  let currentChapter = null;
  let sceneIndex = 0;
  let onDone = null;

  const els = {
    screen: () => document.getElementById('screen-story'),
    bg: () => document.getElementById('story-bg'),
    chapter: () => document.getElementById('story-chapter'),
    portrait: () => document.getElementById('story-portrait'),
    speaker: () => document.getElementById('story-speaker'),
    text: () => document.getElementById('story-text'),
    hint: () => document.getElementById('story-hint'),
    choices: () => document.getElementById('story-choices'),
  };

  function showScreen() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    els.screen().classList.add('active');
  }

  function hideChoices() {
    const c = els.choices();
    c.innerHTML = '';
    c.classList.add('hidden');
  }

  function typeText(el, text, speed = 28) {
    return new Promise(resolve => {
      el.textContent = '';
      let i = 0;
      const iv = setInterval(() => {
        el.textContent += text[i++];
        if (i >= text.length) { clearInterval(iv); resolve(); }
      }, speed);
      el.dataset.full = text;
      el.dataset.iv = iv;
    });
  }

  function renderScene(scene) {
    hideChoices();
    els.hint().style.display = 'block';
    const portrait = Portraits[scene.portrait] ? Portraits[scene.portrait]() : Portraits.unknown();
    els.portrait().innerHTML = portrait;
    els.speaker().textContent = scene.speaker || '';
    typeText(els.text(), scene.text || '');
  }

  function renderChoices(choices) {
    hideChoices();
    els.hint().style.display = 'none';
    const c = els.choices();
    c.classList.remove('hidden');
    choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = `choice-btn ${choice.tagClass || ''}`;
      btn.innerHTML = `<span class="choice-tag">${choice.tag || ''}</span>${choice.desc}`;
      btn.addEventListener('click', () => handleChoice(choice));
      c.appendChild(btn);
    });
  }

  function handleChoice(choice) {
    if (choice.effect && window.Game) {
      Game.applyEffect(choice.effect);
    }
    if (choice.ending) {
      // go to ending story
      const endChapter = STORY_CHAPTERS.find(c => c.ending === choice.ending);
      if (endChapter) { playChapter(endChapter.id, () => showEnding(choice.ending)); return; }
    }
    if (choice.next) {
      playChapter(choice.next, onDone);
    } else {
      finish();
    }
  }

  function finish() {
    const ch = currentChapter;
    if (ch && ch.gangEvent && window.Game) Game.setGangEvent(ch.gangEvent);
    if (ch && ch.policeEvent && window.Game) Game.setPoliceEvent(ch.policeEvent);
    if (ch && ch.gotoGame && window.Game) {
      Game.showGameScreen();
      return;
    }
    if (onDone) onDone(ch);
  }

  function showEnding(type) {
    if (window.Game) Game.triggerEnding(type);
  }

  function advance() {
    const ch = currentChapter;
    if (!ch) return;
    const textEl = els.text();
    // If still typing, complete instantly
    if (textEl.dataset.iv) {
      clearInterval(Number(textEl.dataset.iv));
      textEl.dataset.iv = '';
      textEl.textContent = textEl.dataset.full || textEl.textContent;
      return;
    }
    sceneIndex++;
    if (sceneIndex < ch.scenes.length) {
      renderScene(ch.scenes[sceneIndex]);
    } else if (ch.choices && ch.choices.length) {
      renderChoices(ch.choices);
    } else {
      finish();
    }
  }

  function playChapter(id, callback) {
    const ch = STORY_CHAPTERS.find(c => c.id === id);
    if (!ch) { if (callback) callback(null); return; }
    currentChapter = ch;
    sceneIndex = 0;
    onDone = callback;
    showScreen();
    // background
    const bg = els.bg();
    bg.style.cssText = `background: ${ch.bg || 'linear-gradient(180deg,#1a0a04,#0d0604)'};`;
    els.chapter().textContent = ch.title || '';
    hideChoices();
    if (ch.scenes && ch.scenes.length) {
      renderScene(ch.scenes[0]);
    } else if (ch.choices) {
      renderChoices(ch.choices);
    }
  }

  // tap anywhere on the story to advance
  function init() {
    const storyEl = document.getElementById('screen-story');
    storyEl.addEventListener('click', (e) => {
      if (!e.target.closest('.story-choices')) advance();
    });
  }

  return { init, playChapter, advance };
})();
