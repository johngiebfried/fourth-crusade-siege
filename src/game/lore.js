/**
 * The textbook of the day: short factual glosses that appear beside the game.
 *
 * ── No quotations ─────────────────────────────────────────────────────────
 *
 * There used to be a set of eyewitness passages here, attributed to
 * Villehardouin and Robert of Clari, and a held-back set from Choniates,
 * Gunther of Pairis and Innocent III. They are gone, deliberately, and should
 * not come back in that form. Checked against the Smith and Noble translations,
 * the Villehardouin/Clari set had a scene given to the wrong chronicler (the
 * blind doge in the bow is Villehardouin §173, not Clari), a reading that
 * reversed the sense of §128, one entry that ran two emperors and two years
 * together, and five that could not be found in either text at all. In a tool
 * students quote from, a paraphrase in quotation form with a name on it is
 * worse than nothing. `check-lore.mjs` refuses any entry with a `source`.
 *
 * ── On the facts ──────────────────────────────────────────────────────────
 *
 * The same review found errors among these too, and they were corrected or cut
 * rather than left: Hagia Sophia's dome was never the world's largest (the
 * Pantheon's is bigger); the Venetian arrests were 1171 and the 1182 massacre
 * fell mainly on Genoese and Pisans; the papal apology to the Ecumenical
 * Patriarch was 2004, not 2001; the Fourth Crusade did fight a Muslim army
 * (Villehardouin §230); mining was not useless against the land walls; and two
 * claims with no source behind them were removed.
 *
 * ── On the sets ───────────────────────────────────────────────────────────
 *
 * Kept as separate sets rather than one pile so that a screen can ask for the
 * kind of thing that suits it — siegecraft after a climb, the fleet at the
 * bribe, the aftermath at the end.
 */

/* ------------------------------------------------------------- siegecraft */

export const SIEGECRAFT = [
  {
    text: 'A scaling ladder was the cheapest way into a fortress and by far the most dangerous. The first man up faced the whole garrison alone, which is why the honour of being first was worth so much.',
    lane: 'both',
  },
  {
    text: 'The counterweight trebuchet was only just arriving in the west in 1204. Most stone-throwers at this siege were mangonels worked by teams hauling on ropes — faster to build, far weaker, and useless against a wall like this one.',
    lane: 'land',
  },
  {
    text: 'Against masonry this thick, stone-throwers were not meant to breach. They were meant to sweep the parapet clear so that men on ladders had a moment in which nobody was waiting for them.',
    lane: 'land',
  },
  {
    text: 'A wet moat did not have to be deep to win. It only had to stop a siege tower from being wheeled up to the wall, and it did.',
    lane: 'land',
  },
  {
    text: 'Ships lashed in pairs were steadier than ships alone, and a bridge slung between two mast-tops put men *above* the parapet instead of below it. This was the Venetian answer to a wall you cannot undermine.',
    lane: 'sea',
  },
  {
    text: 'Casualties in a failed escalade were appalling and casualties in a successful one were slight. Everything depended on the few minutes in which a lodgement was either made or not.',
    lane: 'both',
  },
  {
    text: 'Fire did more damage to Constantinople than any siege engine. Three fires during the occupation destroyed more of the city than the fighting did.',
    lane: 'both',
  },
]

/* ------------------------------------------------------------ the walls */

export const WALLS = [
  {
    text: 'The Theodosian walls were raised in the 5th century and had held for eight hundred years. In all that time no besieging army had ever forced them.',
    lane: 'land',
  },
  {
    text: 'The land defence was three lines deep: a moat, then a low outer wall with its own towers, then the great inner wall — twelve metres high, five thick, with ninety-six towers.',
    lane: 'land',
  },
  {
    text: 'An attacker who took the outer wall found himself on a narrow terrace, in the open, with the inner wall towering above him and archers on both flanks. It was designed as a killing ground and it worked as one.',
    lane: 'land',
  },
  {
    text: 'The banded courses of brick in the stonework are not decoration. They levelled the coursing as it rose and gave the wall some flex.',
    lane: 'both',
  },
  {
    text: 'The sea walls along the Golden Horn were single, lower, and much weaker than the land walls. The Byzantines relied on the harbour chain to keep enemies away from them entirely.',
    lane: 'sea',
  },
  {
    text: 'A chain on floating booms ran from the city to the tower at Galata and closed the Horn. The Venetians broke it in July 1203 — and after that the weakest wall in Constantinople was the one an enemy fleet could reach.',
    lane: 'sea',
  },
  {
    text: 'The final assault of 12 April 1204 came at the Golden Horn wall, not the land walls. The land walls were never taken. They were simply gone round.',
    lane: 'sea',
  },
  {
    text: 'The stretch that fell had been heightened in timber during the winter. Wooden hoarding could be built fast, and it burned.',
    lane: 'sea',
  },
]

/* -------------------------------------------------------------- the city */

/*
 * Held in reserve, like the siegecraft notes on the assault HUD.
 *
 * These used to gloss the title card. The panel is the one thing standing
 * between the class and the model of the city they are about to attack, and a
 * three-line note pushed it down over the Golden Horn for the sake of a fact
 * nobody was reading at that moment. The set stays — it is the obvious source
 * if a debrief screen ever wants it — but nothing draws from it today.
 */
export const CITY = [
  {
    text: 'Constantinople in 1200 held perhaps 400,000 people. Paris held around 50,000. Nothing in Latin Christendom was remotely comparable.',
  },
  {
    text: 'No foreign army had taken the city by storm in its nine hundred years. It had been besieged by Avars, Arabs, Rus and Bulgars, and had never fallen.',
  },
  {
    text: 'The Hagia Sophia had stood for nearly seven centuries when the army arrived, and it was still the largest church in Christendom.',
  },
  {
    text: 'The Hippodrome held bronzes gathered from across the ancient world. Most were melted down for coin in the months after the city fell.',
  },
  {
    text: "The four bronze horses on the front of St Mark's in Venice stood over the Hippodrome starting gates until 1204. They are the most visible surviving loot of this siege.",
  },
  {
    text: 'Venice had a merchant quarter inside the walls. In 1171 the emperor had every Venetian in the empire arrested and their goods seized; in 1182 a mob massacred the Latins of the city. Some of the men in the fleet remembered both.',
  },
]

/* --------------------------------------------------------- the aftermath */

export const AFTERMATH = [
  {
    text: 'The army had contracted to pay Venice 85,000 marks for the fleet and could not raise it. Everything that followed — Zara, Constantinople, the sack — began as a debt.',
  },
  {
    text: 'The treaty of March 1204 divided the empire before a wall had been taken. A quarter to the new emperor, and the rest split between Venice and the crusaders.',
  },
  {
    text: 'Baldwin of Flanders was crowned emperor in the Hagia Sophia in May 1204. His Latin Empire lasted 57 years and was broke for most of them.',
  },
  {
    text: 'The Byzantines took Constantinople back in 1261, almost without a fight. What they recovered was a wrecked city with a fraction of its old population.',
  },
  {
    text: 'In 2001 Pope John Paul II expressed regret for the sack in Athens, and in 2004, eight hundred years on, to the Ecumenical Patriarch.',
  },
]

/* ----------------------------------------------------------- the bargain */

export const FLEET = [
  {
    text: 'Venice contracted in 1201 to carry 33,500 men and 4,500 horses, and spent a year building the fleet. Barely a third of the army turned up to board it.',
  },
  {
    text: 'The republic suspended its own commerce for eighteen months to build the ships. The debt was owed by the men who came, for the passage of the men who did not.',
  },
  {
    text: 'Enrico Dandolo was in his nineties and blind when he took the cross. He was carried ashore under his banner at the first assault on the sea walls.',
  },
  {
    text: 'The fleet that sailed was perhaps 200 vessels: round transports for horses, and the war galleys that broke the harbour chain.',
  },
  {
    text: 'The horse transports had doors cut in their sides below the waterline, sealed for the voyage, so that knights could ride straight out onto a beach. It is one of the more remarkable pieces of naval engineering of the century.',
  },
]

/* ---------------------------------------------------------------- access */

export const SETS = {
  siegecraft: SIEGECRAFT,
  walls: WALLS,
  city: CITY,
  aftermath: AFTERMATH,
  fleet: FLEET,
}

/**
 * One entry from a set, chosen without repeating until the set is used up.
 *
 * A class plays this more than once, so a random pick is wrong: it will show
 * the same passage twice in one session and never show a third of them at all.
 * The seen list is kept per set for the life of the page.
 */
const seen = new Map()

export function pickLore(setName, { lane } = {}) {
  const set = SETS[setName]
  if (!set || set.length === 0) return null

  // A land failure drawing the story of the harbour chain is worse than no
  // gloss at all: it reads as the game not knowing what the student just
  // watched. Untagged passages fit anywhere.
  const relevant = lane ? set.filter((e) => !e.lane || e.lane === lane || e.lane === 'both') : set
  if (relevant.length === 0) return null

  // Keyed per lane as well as per set. Keyed per set alone, exhausting the six
  // land passages would wipe the sea lane's history along with them.
  const key = lane ? `${setName}:${lane}` : setName
  const used = seen.get(key) ?? []
  const pool = relevant.filter((e) => !used.includes(set.indexOf(e)))
  const from = pool.length ? pool : relevant
  if (!pool.length) seen.set(key, [])
  const entry = from[Math.floor(Math.random() * from.length)]
  seen.set(key, [...(seen.get(key) ?? []), set.indexOf(entry)])
  return entry
}

/**
 * Forget what has been shown. The game does not need this — a page load is a
 * fresh history — but the checks below do, and a class that plays twice in a
 * row without reloading is the other caller it would serve.
 */
export function resetLore() {
  seen.clear()
}

/** Every entry, for the checks. */
export function allLore() {
  return Object.entries(SETS).flatMap(([name, set]) =>
    set.map((entry, i) => ({ ...entry, set: name, index: i }))
  )
}
