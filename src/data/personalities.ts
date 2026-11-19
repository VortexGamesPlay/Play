import type { PersonalityDef } from '@core/content';

export const PERSONALITIES: Record<string, PersonalityDef> = {
  joueur:    { id: 'joueur',    name: 'Joueur',    up: 'spd', down: 'def', description: 'Ne tient pas en place et invente des jeux avec tout.' },
  timide:    { id: 'timide',    name: 'Timide',    up: 'def', down: 'atk', description: 'Se cache souvent, mais s\'attache profondément.' },
  brave:     { id: 'brave',     name: 'Brave',     up: 'atk', down: 'spd', description: 'Fonce toujours en premier, même quand c\'est une mauvaise idée.' },
  calme:     { id: 'calme',     name: 'Calme',     up: 'hp',  down: 'atk', description: 'Aime les siestes au soleil et les moments paisibles.' },
  curieux:   { id: 'curieux',   name: 'Curieux',   up: null,  down: null,  description: 'Inspecte chaque recoin du sanctuaire.' },
  gourmand:  { id: 'gourmand',  name: 'Gourmand',  up: 'hp',  down: 'spd', description: 'Toujours le premier à la gamelle.' },
  fier:      { id: 'fier',      name: 'Fier',      up: 'atk', down: 'def', description: 'Prend la pose dès qu\'on le regarde.' },
  doux:      { id: 'doux',      name: 'Doux',      up: 'def', down: 'spd', description: 'Console les autres créatures quand elles sont tristes.' },
  espiegle:  { id: 'espiegle',  name: 'Espiègle',  up: 'spd', down: 'hp',  description: 'Adore faire des farces aux autres pensionnaires.' },
  reveur:    { id: 'reveur',    name: 'Rêveur',    up: null,  down: null,  description: 'Fixe les étoiles pendant des heures.' },
};
