/**
 * The textbook of the day: short passages that appear beside the game.
 *
 * ── On the quotations ─────────────────────────────────────────────────────
 *
 * Every passage attributed to a chronicler here is *my own plain-English
 * rendering* of what that writer says at that point, not a transcription of a
 * published translation. Modern translations are somebody's copyrighted work
 * and are not reproduced. The renderings are short, they stay close to the
 * sense, and they are attributed to the writer and not to a translator. Anyone
 * quoting these in print should go to a real edition:
 *
 *   Geoffrey of Villehardouin, *La Conquête de Constantinople* — a marshal of
 *     Champagne, present, and one of the men who negotiated the Venetian
 *     treaty. Defensive about the diversion, and worth reading as such.
 *   Robert of Clari, *La Prise de Constantinople* — a poor knight of Picardy.
 *     Sees the siege from below and is far more interested in the plunder and
 *     the marvels of the city than in who was right.
 *   Niketas Choniates, *Historia* — a senior Byzantine official who lost
 *     everything in the sack and walked out of the city with refugees.
 *   Gunther of Pairis, *Hystoria Constantinopolitana* — a German Cistercian,
 *     writing up his abbot's relic-theft as a pious triumph.
 *   Innocent III, *Register* — the pope's letters, including the one where he
 *     finds out what his crusade has actually done.
 *
 * ── On the sets ───────────────────────────────────────────────────────────
 *
 * They are kept as separate sets rather than one pile so that a screen can ask
 * for the kind of thing that suits it: eyewitness voice where the game wants
 * atmosphere, siegecraft where a student has just watched a ladder fall, the
 * Byzantine side where the game is about to reward a sack. Each set is long
 * enough not to repeat inside a session and short enough to have been chosen
 * rather than scraped.
 */

/* ------------------------------------------------- the men who were there */

export const CHRONICLE = [
  {
    text: 'Never had so many been besieged by so few — for we had no more than twenty thousand, and they were beyond counting.',
    source: 'Geoffrey of Villehardouin',
  },
  {
    text: 'Those who had never seen Constantinople stared at it a long while, for they could not believe a city so rich could exist in all the world.',
    source: 'Geoffrey of Villehardouin',
  },
  {
    text: 'Not one of us was without fear, and no wonder, for such a thing had never been attempted by so few since the world was made.',
    source: 'Geoffrey of Villehardouin',
  },
  {
    text: 'The ladders on the ships came so close to the walls that those on them and those on the towers fought hand to hand with swords and lances.',
    source: 'Geoffrey of Villehardouin',
  },
  {
    text: 'The city was so rich, and so full of every good thing, that a poor knight might there become as great a lord as he wished.',
    source: 'Robert of Clari',
  },
  {
    text: 'The high men, the rich men, took the treasure and shared it among themselves, and the common people of the army got nothing of it.',
    source: 'Robert of Clari',
  },
  {
    text: 'The Emperor Alexios had pitched his tents on a hill, and when our men rode out against him he turned back into the city and did not fight.',
    source: 'Robert of Clari',
  },
  {
    text: 'They broke open the sanctuaries and carried off whatever was in them, and led mules and horses in under the dome itself to load them.',
    source: 'Niketas Choniates',
  },
  {
    text: 'Even the Saracens are merciful by comparison — they at least spared the churches.',
    source: 'Niketas Choniates',
  },
  {
    text: 'They set fires as their forefathers had, and in three burnings destroyed more houses than stand in three of the greatest cities of France.',
    source: 'Niketas Choniates',
  },
  {
    text: 'How shall I begin to tell of what these impious men did? They tore the altar of the Great Church into pieces and divided it among themselves.',
    source: 'Niketas Choniates',
  },
  {
    text: 'He judged it no theft but a holy and pious act to carry off the relics, so long as they went to a better home.',
    source: 'Gunther of Pairis, on his abbot',
  },
  {
    text: 'You took up the cross against the infidel, and turned it against Christians; you were to recover Jerusalem, and you have ruined Constantinople.',
    source: 'Innocent III, on hearing of the sack',
  },
]

/* ------------------------------------------------------------- siegecraft */

export const SIEGECRAFT = [
  {
    text: 'A scaling ladder was the cheapest way into a fortress and by far the most dangerous. The first man up faced the whole garrison alone, which is why the honour of being first was worth so much.',
  },
  {
    text: 'Ladders were deliberately made a little short. One that overtopped the parapet gave the defenders something to push against; one that reached just under it was harder to lever away.',
  },
  {
    text: 'The counterweight trebuchet was only just arriving in the west in 1204. Most stone-throwers at this siege were mangonels worked by teams hauling on ropes — faster to build, far weaker, and useless against a wall like this one.',
  },
  {
    text: 'Against masonry this thick, stone-throwers were not meant to breach. They were meant to sweep the parapet clear so that men on ladders had a moment in which nobody was waiting for them.',
  },
  {
    text: 'Mining was the reliable way through a wall — dig under it, prop the tunnel with timber, burn the props. It was also useless here: the seaward walls stood in water and the land walls in solid rock.',
  },
  {
    text: 'A wet moat did not have to be deep to win. It only had to stop a siege tower from being wheeled up to the wall, and it did.',
  },
  {
    text: 'Ships lashed in pairs were steadier than ships alone, and a bridge slung between two mast-tops put men *above* the parapet instead of below it. This was the Venetian answer to a wall you cannot undermine.',
  },
  {
    text: 'Assaulting from a ship meant fighting on a footing that moved. The Venetians solved it by grappling to the wall and hauling in, so that ship and masonry rose and fell together.',
  },
  {
    text: 'Casualties in a failed escalade were appalling and casualties in a successful one were slight. Everything depended on the few minutes in which a lodgement was either made or not.',
  },
  {
    text: 'Fire did more damage to Constantinople than any siege engine. Three fires during the occupation destroyed more of the city than the fighting did.',
  },
]

/* ------------------------------------------------------------ the walls */

export const WALLS = [
  {
    text: 'The Theodosian walls were raised in the 5th century and had held for eight hundred years. In all that time no besieging army had ever forced them.',
  },
  {
    text: 'The land defence was three lines deep: a moat, then a low outer wall with its own towers, then the great inner wall — twelve metres high, five thick, with ninety-six towers.',
  },
  {
    text: 'An attacker who took the outer wall found himself on a narrow terrace, in the open, with the inner wall towering above him and archers on both flanks. It was designed as a killing ground and it worked as one.',
  },
  {
    text: 'The banded courses of brick in the stonework are not decoration. They levelled the coursing as it rose and gave the wall some flex — which is why it survived the earthquakes that flattened everything around it.',
  },
  {
    text: 'The sea walls along the Golden Horn were single, lower, and much weaker than the land walls. The Byzantines relied on the harbour chain to keep enemies away from them entirely.',
  },
  {
    text: 'A chain on floating booms ran from the city to the tower at Galata and closed the Horn. The Venetians broke it in July 1203 — and after that the weakest wall in Constantinople was the one an enemy fleet could reach.',
  },
  {
    text: 'The final assault of 12 April 1204 came at the Golden Horn wall, not the land walls. The land walls were never taken. They were simply gone round.',
  },
  {
    text: 'The stretch that fell had been heightened in timber during the winter. Wooden hoarding could be built fast, and it burned.',
  },
]

/* -------------------------------------------------------------- the city */

export const CITY = [
  {
    text: 'Constantinople in 1200 held perhaps 400,000 people. Paris held around 50,000. Nothing in Latin Christendom was remotely comparable.',
  },
  {
    text: 'The crusaders were the first hostile army to enter the city in its nine hundred years. It had been besieged by Avars, Arabs, Rus and Bulgars, and had never fallen.',
  },
  {
    text: 'The Hagia Sophia had stood for nearly seven centuries when the army arrived, and its dome was the largest in the world. It would keep that record for another two hundred years.',
  },
  {
    text: 'The Hippodrome held bronzes gathered from across the ancient world. Most were melted down for coin in the months after the city fell.',
  },
  {
    text: "The four bronze horses on the front of St Mark's in Venice stood over the Hippodrome starting gates until 1204. They are the most visible surviving loot of this siege.",
  },
  {
    text: 'Venice had a merchant quarter inside the walls, and Venetians had been expelled and massacred there in 1182. Some of the men in the fleet remembered it personally.',
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
    text: 'No crusader of the Fourth Crusade ever reached Jerusalem, or Egypt, or fought a Muslim army. This was a crusade that never once met the enemy it was called against.',
  },
  {
    text: 'In 2001 Pope John Paul II apologised to the Ecumenical Patriarch for the sack — 797 years afterwards.',
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
  chronicle: CHRONICLE,
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

export function pickLore(setName) {
  const set = SETS[setName]
  if (!set || set.length === 0) return null
  const used = seen.get(setName) ?? []
  const pool = set.filter((_, i) => !used.includes(i))
  const from = pool.length ? pool : set
  if (!pool.length) seen.set(setName, [])
  const entry = from[Math.floor(Math.random() * from.length)]
  seen.set(setName, [...(seen.get(setName) ?? []), set.indexOf(entry)])
  return entry
}

/** Every entry, for the checks — nothing empty, everything attributed. */
export function allLore() {
  return Object.entries(SETS).flatMap(([name, set]) =>
    set.map((entry, i) => ({ ...entry, set: name, index: i }))
  )
}
