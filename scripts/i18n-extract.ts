// Outil : liste les textes sans traduction anglaise (contenu du jeu + appels t('…') du code).
// Usage : npx vite-node scripts/i18n-extract.ts [content|ui]
import { contentStrings } from '../src/i18n/content';
import { EN } from '../src/i18n/en';
import { uiStrings } from './i18n-strings';

const mode = process.argv[2] ?? 'content';
const list = (mode === 'ui' ? uiStrings() : contentStrings()).filter((s) => EN[s] === undefined);
console.log(JSON.stringify(list, null, 0));
console.error(`${list.length} textes sans traduction (${mode})`);
