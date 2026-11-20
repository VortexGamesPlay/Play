// Outil ponctuel : rend traduisibles les textes français écrits en dur dans le code (JSX, toasts, erreurs).
// Usage : node scripts/i18n-codemod.mjs [--write]   (sans --write : simple rapport)
import ts from 'typescript';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const WRITE = process.argv.includes('--write');
const ROOTS = ['src/ui', 'src/store', 'src/core', 'src/services'];
const SKIP_FILE = /i18n|__tests__|\.test\.|core\/save\/renames/;
const TEXT_ATTRS = new Set(['title', 'aria-label', 'placeholder', 'alt', 'data-tip', 'label', 'confirmLabel', 'body', 'text', 'hint', 'caption', 'subtitle', 'description', 'emptyText', 'cta', 'tip']);
const TEXT_PROPS = new Set(['title', 'body', 'label', 'confirmLabel', 'caption', 'hint', 'text', 'subtitle', 'tip', 'cta', 'emptyText']);
const NON_TEXT_ATTRS = new Set(['className', 'style', 'key', 'id', 'href', 'type', 'role', 'src', 'name', 'viewBox', 'd', 'fill', 'stroke', 'kind', 'icon', 'currency', 'variant', 'route', 'tone', 'size', 'color', 'value', 'htmlFor', 'target', 'rel', 'width', 'height', 'transform', 'points', 'mode', 'tab', 'shape']);

function walk(d) { return readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) && !SKIP_FILE.test(p) ? [p] : []; }); }
const looksText = (s) => /[A-Za-zÀ-ÿ]/.test(s) && !/^[a-z0-9_.:/#-]+$/.test(s.trim()) && !/^(https?:|\/|\.\/|#)/.test(s.trim()) && !/^[a-z]+(-[a-z0-9]+)+$/.test(s.trim())
  && (/[À-ÿŒœ ]/.test(s.trim()) || /^[A-ZÀ-ÝŒ]/.test(s.trim()) || /[.!?…:]$/.test(s.trim()));
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');

let total = 0; const moduleLevel = [];
for (const file of ROOTS.flatMap(walk)) {
  const src = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = []; // {start,end,text}
  const inFunction = (n) => { for (let p = n.parent; p; p = p.parent) if (ts.isFunctionLike(p)) return true; return false; };
  const isTCall = (n) => { for (let p = n.parent; p && !ts.isSourceFile(p); p = p.parent) { if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && ['t', 'tp', 'tr'].includes(p.expression.text)) return true; if (ts.isFunctionLike(p) || ts.isJsxElement(p)) return false; } return false; };
  const tmplCall = (node) => {
    // `a ${x} b` → tr('a {x} b', { x })
    let text = node.head.text; const params = []; const used = new Map();
    node.templateSpans.forEach((sp, i) => {
      let name = ts.isIdentifier(sp.expression) ? sp.expression.text : ts.isPropertyAccessExpression(sp.expression) ? sp.expression.name.text : `p${i}`;
      if (used.has(name) && used.get(name) !== sp.expression.getText(sf)) name = `${name}${i}`;
      used.set(name, sp.expression.getText(sf));
      text += `{${name}}` + sp.literal.text;
      if (!params.some((p) => p.startsWith(name + ':') || p === name)) params.push(ts.isIdentifier(sp.expression) && sp.expression.text === name ? name : `${name}: ${sp.expression.getText(sf)}`);
    });
    if (!looksText(text.replace(/\{\w+\}/g, ''))) return null;
    return `tr('${esc(text)}', { ${params.join(', ')} })`;
  };
  const lit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return looksText(node.text) ? `tr('${esc(node.text)}')` : null;
    if (ts.isTemplateExpression(node)) return tmplCall(node);
    return null;
  };
  const record = (node, repl, wrapBraces = false) => {
    if (!repl || isTCall(node)) return;
    if (!inFunction(node)) { moduleLevel.push(`${file}:${sf.getLineAndCharacterOfPosition(node.getStart()).line + 1} ${node.getText(sf).slice(0, 60)}`); return; }
    edits.push({ start: node.getStart(sf), end: node.getEnd(), text: wrapBraces ? `{${repl}}` : repl });
  };
  // Remonte depuis un littéral jusqu'à un contexte « texte » (JSX, propriété de texte, ternaire…)
  const textContext = (node) => {
    let p = node.parent;
    while (p && (ts.isConditionalExpression(p) || ts.isParenthesizedExpression(p) || (ts.isBinaryExpression(p) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(p.operatorToken.kind)))) {
      if (ts.isConditionalExpression(p) && p.condition === node) return null;
      if (ts.isBinaryExpression(p) && p.left === node && p.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return null;
      node = p; p = p.parent;
    }
    if (!p) return null;
    if (ts.isJsxExpression(p)) {
      const gp = p.parent;
      if (ts.isJsxAttribute(gp)) return NON_TEXT_ATTRS.has(gp.name.getText(sf)) ? null : 'attr';
      return 'child';
    }
    if (ts.isPropertyAssignment(p) && p.initializer === node && TEXT_PROPS.has(p.name.getText(sf))) return 'prop';
    if (ts.isCallExpression(p)) {
      const callee = p.expression.getText(sf); const idx = p.arguments.indexOf(node);
      if ((callee === 'assertGame' && idx === 2) || (callee === 'grant' && idx === 3) || (callee === 'spend' && idx === 3) || (callee === 'addEgg' && idx === 2) || (callee === 'confirm' || callee === 'alert' || callee === 'window.confirm')) return 'arg';
      if (/(^|\.)Error$/.test(callee) || callee === 'GameError') return null;
    }
    if (ts.isNewExpression(p)) {
      const callee = p.expression.getText(sf); const idx = p.arguments?.indexOf(node);
      if ((callee === 'GameError' && idx === 1) || (callee === 'Error' && idx === 0 && file.includes('services'))) return 'arg';
    }
    return null;
  };
  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const raw = node.getText(sf); const trimmed = raw.trim();
      if (trimmed && looksText(trimmed) && !/[{}<>&]/.test(trimmed)) {
        const lead = raw.length - raw.trimStart().length; const start = node.getStart(sf) + lead;
        const text = trimmed.replace(/\s+/g, ' ');
        if (inFunction(node)) edits.push({ start, end: start + trimmed.length, text: `{tr('${esc(text)}')}` });
      }
    } else if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer) && TEXT_ATTRS.has(node.name.getText(sf))) {
      record(node.initializer, lit(node.initializer), true);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
      const ctx = textContext(node);
      if (ctx) record(node, lit(node));
      if (ts.isTemplateExpression(node)) return; // ne pas descendre dans les morceaux
    }
    if (ts.isCallExpression(node) && node.expression.getText(sf).endsWith('toLocaleString') && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === 'fr-FR') {
      edits.push({ start: node.arguments[0].getStart(sf), end: node.arguments[0].getEnd(), text: 'intlLocale()' });
    }
    if (ts.isCallExpression(node) && /toLocale(Date|Time)?String$/.test(node.expression.getText(sf)) && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === 'fr-FR') {
      edits.push({ start: node.arguments[0].getStart(sf), end: node.arguments[0].getEnd(), text: 'intlLocale()' });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!edits.length) continue;
  // dédoublonnage (un même nœud peut être vu deux fois) et application de la fin vers le début
  const uniq = [...new Map(edits.map((e) => [`${e.start}:${e.end}`, e])).values()].sort((a, b) => b.start - a.start);
  const nonOverlap = []; let lastStart = Infinity;
  for (const e of uniq) if (e.end <= lastStart) { nonOverlap.push(e); lastStart = e.start; }
  let out = src;
  for (const e of nonOverlap) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  const needTr = /\btr\(/.test(out) && !/import \{[^}]*\btr\b[^}]*\} from '[^']*i18n'/.test(out);
  const needIntl = /intlLocale\(\)/.test(out) && !/\bintlLocale\b[^(]*from/.test(out) && !/import \{[^}]*\bintlLocale\b/.test(out);
  if (needTr || needIntl) {
    const rel = relative(dirname(file), 'src/i18n').replace(/\\/g, '/'); const path = rel.startsWith('.') ? rel : './' + rel;
    const names = [needTr && 'tr', needIntl && 'intlLocale'].filter(Boolean).join(', ');
    const imports = [...out.matchAll(/^import [^;]+;\n/gm)]; const at = imports.length ? imports[imports.length - 1].index + imports[imports.length - 1][0].length : 0;
    out = out.slice(0, at) + `import { ${names} } from '${path}';\n` + out.slice(at);
  }
  total += nonOverlap.length;
  console.log(`${file}: ${nonOverlap.length}`);
  if (WRITE) writeFileSync(file, out);
}
console.log(`\n${total} textes rendus traduisibles${WRITE ? '' : ' (rapport seulement)'}.`);
if (moduleLevel.length) console.log(`\n${moduleLevel.length} textes au niveau module (à traiter à la main) :\n` + moduleLevel.join('\n'));
