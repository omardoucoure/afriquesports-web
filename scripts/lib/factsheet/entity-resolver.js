/**
 * Entity Resolver
 *
 * Resolves player/team names to unique IDs from authoritative sources.
 * Uses Transfermarkt as primary source, with fallbacks.
 */

const { EntityKind, addEntity } = require('./schema');

/**
 * Known player mappings (cache of resolved entities)
 * In production, this would be backed by a database
 */
const KNOWN_PLAYERS = {
  'pedri': {
    name: 'Pedri',
    aliases: ['Pedro González López', 'Pedri González'],
    ids: {
      transfermarktId: '901292',
      fbrefId: 'pedri',
      sofascoreId: '934235'
    },
    team: 'Barcelona',
    nationality: 'Spain',
    position: 'Central Midfield'
  },
  'jude bellingham': {
    name: 'Jude Bellingham',
    aliases: ['Jude Victor William Bellingham'],
    ids: {
      transfermarktId: '581678',
      fbrefId: 'jude-bellingham',
      sofascoreId: '914561'
    },
    team: 'Real Madrid',
    nationality: 'England',
    position: 'Attacking Midfield'
  },
  'vitinha': {
    name: 'Vitinha',
    aliases: ['Vítor Ferreira', 'Vitor Machado Ferreira'],
    ids: {
      transfermarktId: '485004',
      fbrefId: 'vitinha',
      sofascoreId: '934725'
    },
    team: 'PSG',
    nationality: 'Portugal',
    position: 'Central Midfield',
    disambiguationNotes: 'PSG midfielder, not Vitinha from Marseille'
  },
  'rodri': {
    name: 'Rodri',
    aliases: ['Rodrigo Hernández Cascante', 'Rodrigo Hernandez'],
    ids: {
      transfermarktId: '357565',
      fbrefId: 'rodrigo-hernandez',
      sofascoreId: '827653'
    },
    team: 'Manchester City',
    nationality: 'Spain',
    position: 'Defensive Midfield'
  },
  'declan rice': {
    name: 'Declan Rice',
    aliases: [],
    ids: {
      transfermarktId: '396823',
      fbrefId: 'declan-rice',
      sofascoreId: '864264'
    },
    team: 'Arsenal',
    nationality: 'England',
    position: 'Defensive Midfield'
  },
  'jamal musiala': {
    name: 'Jamal Musiala',
    aliases: ['Jamal Musiala'],
    ids: {
      transfermarktId: '580195',
      fbrefId: 'jamal-musiala',
      sofascoreId: '942570'
    },
    team: 'Bayern Munich',
    nationality: 'Germany',
    position: 'Attacking Midfield'
  },
  'kevin de bruyne': {
    name: 'Kevin De Bruyne',
    aliases: ['KDB'],
    ids: {
      transfermarktId: '88755',
      fbrefId: 'kevin-de-bruyne',
      sofascoreId: '70996'
    },
    team: 'Manchester City',
    nationality: 'Belgium',
    position: 'Attacking Midfield'
  },
  'bruno fernandes': {
    name: 'Bruno Fernandes',
    aliases: ['Bruno Miguel Borges Fernandes'],
    ids: {
      transfermarktId: '240306',
      fbrefId: 'bruno-fernandes',
      sofascoreId: '193471'
    },
    team: 'Manchester United',
    nationality: 'Portugal',
    position: 'Attacking Midfield'
  },
  'frenkie de jong': {
    name: 'Frenkie de Jong',
    aliases: ['Frenkie', 'De Jong'],
    ids: {
      transfermarktId: '326330',
      fbrefId: 'frenkie-de-jong',
      sofascoreId: '804297'
    },
    team: 'Barcelona',
    nationality: 'Netherlands',
    position: 'Central Midfield'
  },
  'barella': {
    name: 'Nicolò Barella',
    aliases: ['Nicolo Barella', 'Barella'],
    ids: {
      transfermarktId: '255942',
      fbrefId: 'nicolo-barella',
      sofascoreId: '815082'
    },
    team: 'Inter Milan',
    nationality: 'Italy',
    position: 'Central Midfield'
  },
  'eduardo camavinga': {
    name: 'Eduardo Camavinga',
    aliases: ['Camavinga'],
    ids: {
      transfermarktId: '516018',
      fbrefId: 'eduardo-camavinga',
      sofascoreId: '901627'
    },
    team: 'Real Madrid',
    nationality: 'France',
    position: 'Central Midfield'
  },
  'joão neves': {
    name: 'João Neves',
    aliases: ['Joao Neves', 'Neves'],
    ids: {
      transfermarktId: '801890',
      fbrefId: 'joao-neves',
      sofascoreId: '1096472'
    },
    team: 'PSG',
    nationality: 'Portugal',
    position: 'Central Midfield',
    disambiguationNotes: 'Young Portuguese midfielder at PSG, not Rúben Neves'
  },
  'florian wirtz': {
    name: 'Florian Wirtz',
    aliases: ['Wirtz'],
    ids: {
      transfermarktId: '521361',
      fbrefId: 'florian-wirtz',
      sofascoreId: '929730'
    },
    team: 'Bayer Leverkusen',
    nationality: 'Germany',
    position: 'Attacking Midfield'
  },
  'martin ødegaard': {
    name: 'Martin Ødegaard',
    aliases: ['Martin Odegaard', 'Ødegaard', 'Odegaard'],
    ids: {
      transfermarktId: '316264',
      fbrefId: 'martin-odegaard',
      sofascoreId: '794925'
    },
    team: 'Arsenal',
    nationality: 'Norway',
    position: 'Attacking Midfield'
  },
  'luka modrić': {
    name: 'Luka Modrić',
    aliases: ['Luka Modric', 'Modrić', 'Modric'],
    ids: {
      transfermarktId: '27992',
      fbrefId: 'luka-modric',
      sofascoreId: '7767'
    },
    team: 'Real Madrid',
    nationality: 'Croatia',
    position: 'Central Midfield'
  }
};

/**
 * Known team mappings
 */
const KNOWN_TEAMS = {
  'barcelona': {
    name: 'FC Barcelona',
    aliases: ['Barça', 'Barca', 'FCB'],
    ids: {
      transfermarktId: '131',
      fbrefId: 'barcelona',
      sofascoreId: '2817'
    },
    country: 'Spain',
    league: 'LaLiga'
  },
  'real madrid': {
    name: 'Real Madrid',
    aliases: ['Madrid', 'Real', 'Los Blancos'],
    ids: {
      transfermarktId: '418',
      fbrefId: 'real-madrid',
      sofascoreId: '2829'
    },
    country: 'Spain',
    league: 'LaLiga'
  },
  'psg': {
    name: 'Paris Saint-Germain',
    aliases: ['PSG', 'Paris SG', 'Paris'],
    ids: {
      transfermarktId: '583',
      fbrefId: 'paris-saint-germain',
      sofascoreId: '1644'
    },
    country: 'France',
    league: 'Ligue 1'
  },
  'manchester city': {
    name: 'Manchester City',
    aliases: ['Man City', 'City', 'MCFC'],
    ids: {
      transfermarktId: '281',
      fbrefId: 'manchester-city',
      sofascoreId: '17'
    },
    country: 'England',
    league: 'Premier League'
  },
  'arsenal': {
    name: 'Arsenal FC',
    aliases: ['Arsenal', 'Gunners', 'AFC'],
    ids: {
      transfermarktId: '11',
      fbrefId: 'arsenal',
      sofascoreId: '42'
    },
    country: 'England',
    league: 'Premier League'
  },
  'bayern munich': {
    name: 'Bayern Munich',
    aliases: ['Bayern', 'FCB Munich', 'FC Bayern'],
    ids: {
      transfermarktId: '27',
      fbrefId: 'bayern-munich',
      sofascoreId: '2672'
    },
    country: 'Germany',
    league: 'Bundesliga'
  },
  'inter milan': {
    name: 'Inter Milan',
    aliases: ['Inter', 'Internazionale', 'Nerazzurri'],
    ids: {
      transfermarktId: '46',
      fbrefId: 'inter-milan',
      sofascoreId: '2697'
    },
    country: 'Italy',
    league: 'Serie A'
  }
};

/**
 * Normalize name for lookup
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Resolve a player name to entity
 */
function resolvePlayer(name) {
  const normalized = normalizeName(name);

  // Direct lookup
  if (KNOWN_PLAYERS[normalized]) {
    return {
      ...KNOWN_PLAYERS[normalized],
      kind: EntityKind.PLAYER,
      confidence: 1.0
    };
  }

  // Search in aliases
  for (const [key, player] of Object.entries(KNOWN_PLAYERS)) {
    const allNames = [player.name, ...(player.aliases || [])].map(normalizeName);
    if (allNames.includes(normalized)) {
      return {
        ...player,
        kind: EntityKind.PLAYER,
        confidence: 0.95
      };
    }
  }

  // Partial match (last name only)
  for (const [key, player] of Object.entries(KNOWN_PLAYERS)) {
    const lastName = normalizeName(player.name.split(' ').pop());
    if (normalized === lastName || normalized.includes(lastName)) {
      return {
        ...player,
        kind: EntityKind.PLAYER,
        confidence: 0.8,
        disambiguationNotes: `Matched by last name: ${name}`
      };
    }
  }

  // Not found - return unresolved entity
  return {
    kind: EntityKind.PLAYER,
    name: name,
    aliases: [],
    ids: {},
    confidence: 0.3,
    disambiguationNotes: 'UNRESOLVED - needs manual mapping or API lookup'
  };
}

/**
 * Resolve a team name to entity
 */
function resolveTeam(name) {
  const normalized = normalizeName(name);

  // Direct lookup
  if (KNOWN_TEAMS[normalized]) {
    return {
      ...KNOWN_TEAMS[normalized],
      kind: EntityKind.TEAM,
      confidence: 1.0
    };
  }

  // Search in aliases
  for (const [key, team] of Object.entries(KNOWN_TEAMS)) {
    const allNames = [team.name, ...(team.aliases || [])].map(normalizeName);
    if (allNames.some(n => normalized.includes(n) || n.includes(normalized))) {
      return {
        ...team,
        kind: EntityKind.TEAM,
        confidence: 0.9
      };
    }
  }

  // Not found
  return {
    kind: EntityKind.TEAM,
    name: name,
    aliases: [],
    ids: {},
    confidence: 0.3,
    disambiguationNotes: 'UNRESOLVED - needs manual mapping'
  };
}

/**
 * Resolve multiple entities and add to FactSheet
 */
function resolveEntities(factSheet, playerNames, teamNames = []) {
  const playerRefs = [];
  const teamRefs = [];

  // Resolve players
  for (const name of playerNames) {
    const resolved = resolvePlayer(name);
    const ref = addEntity(factSheet, resolved);
    playerRefs.push({
      name: resolved.name,
      ref,
      confidence: resolved.confidence
    });
  }

  // Resolve teams
  for (const name of teamNames) {
    const resolved = resolveTeam(name);
    const ref = addEntity(factSheet, resolved);
    teamRefs.push({
      name: resolved.name,
      ref,
      confidence: resolved.confidence
    });
  }

  return { playerRefs, teamRefs };
}

/**
 * Get Transfermarkt URL for entity
 */
function getTransfermarktUrl(entity) {
  if (!entity.ids?.transfermarktId) return null;

  if (entity.kind === EntityKind.PLAYER) {
    const slug = entity.name.toLowerCase().replace(/\s+/g, '-');
    return `https://www.transfermarkt.com/${slug}/profil/spieler/${entity.ids.transfermarktId}`;
  }

  if (entity.kind === EntityKind.TEAM) {
    const slug = entity.name.toLowerCase().replace(/\s+/g, '-');
    return `https://www.transfermarkt.com/${slug}/startseite/verein/${entity.ids.transfermarktId}`;
  }

  return null;
}

module.exports = {
  resolvePlayer,
  resolveTeam,
  resolveEntities,
  normalizeName,
  getTransfermarktUrl,
  KNOWN_PLAYERS,
  KNOWN_TEAMS
};
