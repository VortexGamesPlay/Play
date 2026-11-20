import { memo, useId, useState, type CSSProperties, type ReactNode } from 'react';
import type { ArtSpec, BodyShape, EggDef, Palette, ShellStyle, SpeciesDef } from '@core/content';
import { SPECIES, SPECIES_LIST } from '@data/species';
import { EGGS } from '@data/eggs';
import { ELEMENTS } from '@data/elements';
import { darken, hashString, lighten } from './color';
import { resolveLook, type Overlay } from './mutationLook';
import { resolveFx, type Particle } from './mutationFx';
import { creatureSrc, maskStyle, texSrc } from './sprites';

/**
 * Rendu procédural des créatures : chaque espèce est décrite par un ArtSpec (forme, oreilles, queue, ailes, palette…),
 * les gènes décalent subtilement la teinte et les mutations modifient palette et couches visuelles.
 */

interface Geo {
  d: string; top: number; earY: number; earX: number; faceY: number; sideX: number; sideY: number; bottom: number; tail: [number, number];
}

const GEO: Record<BodyShape, Geo> = {
  round:   { d: 'M100 60C132 60 156 84 156 116C156 148 132 170 100 170C68 170 44 148 44 116C44 84 68 60 100 60Z', top: 60, earY: 74, earX: 32, faceY: 108, sideX: 54, sideY: 112, bottom: 170, tail: [148, 148] },
  pear:    { d: 'M100 52C132 52 148 78 150 108C154 146 136 172 100 172C64 172 46 146 50 108C52 78 68 52 100 52Z', top: 52, earY: 66, earX: 30, faceY: 100, sideX: 50, sideY: 114, bottom: 172, tail: [144, 152] },
  drop:    { d: 'M100 38C112 62 156 88 156 126C156 156 132 172 100 172C68 172 44 156 44 126C44 88 88 62 100 38Z', top: 38, earY: 84, earX: 36, faceY: 118, sideX: 55, sideY: 124, bottom: 172, tail: [148, 154] },
  blob:    { d: 'M100 66C146 66 170 96 170 132C170 160 146 172 100 172C54 172 30 160 30 132C30 96 54 66 100 66Z', top: 66, earY: 80, earX: 42, faceY: 118, sideX: 66, sideY: 126, bottom: 172, tail: [160, 150] },
  tall:    { d: 'M100 36C136 36 150 70 150 108C150 150 134 176 100 176C66 176 50 150 50 108C50 70 64 36 100 36Z', top: 36, earY: 50, earX: 28, faceY: 90, sideX: 50, sideY: 112, bottom: 176, tail: [142, 158] },
  ghost:   { d: 'M100 45C142 45 156 85 156 120L156 165Q146 178 136 165Q127 152 118 165Q109 178 100 165Q91 152 82 165Q73 178 64 165Q54 152 44 165L44 120C44 85 58 45 100 45Z', top: 45, earY: 60, earX: 32, faceY: 102, sideX: 56, sideY: 112, bottom: 170, tail: [150, 150] },
  gem:     { d: 'M100 46L148 72L160 122L130 170L70 170L40 122L52 72Z', top: 46, earY: 66, earX: 32, faceY: 108, sideX: 58, sideY: 114, bottom: 170, tail: [150, 152] },
  serpent: { d: 'M100 54C130 54 150 76 150 106C150 138 130 160 100 160C70 160 50 138 50 106C50 76 70 54 100 54Z', top: 54, earY: 68, earX: 30, faceY: 100, sideX: 50, sideY: 106, bottom: 166, tail: [160, 164] },
};

const mirror = 'translate(200 0) scale(-1 1)';

function Pair({ children, x, y, cls }: { children: ReactNode; x: number; y: number; cls?: string }) {
  return (
    <>
      <g className={cls ? `${cls} ${cls}-l` : undefined} style={{ transformOrigin: `${x}px ${y}px` }}><g transform={`translate(${x} ${y})`}>{children}</g></g>
      <g transform={mirror}>
        <g className={cls ? `${cls} ${cls}-r` : undefined} style={{ transformOrigin: `${x}px ${y}px` }}><g transform={`translate(${x} ${y})`}>{children}</g></g>
      </g>
    </>
  );
}

function Ears({ a, g, p, o }: { a: ArtSpec; g: Geo; p: Palette; o: string }) {
  const x = 100 - g.earX, y = g.earY;
  const st = { stroke: o, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  switch (a.ears) {
    case 'cat': return <Pair x={x} y={y}><path d="M-16 12L-8-26L14 4Z" fill={p.primary} {...st} /><path d="M-10 5L-7-13L5 2Z" fill={p.accent} opacity=".85" /></Pair>;
    case 'bunny': return <Pair x={x + 4} y={y}><path d="M-8 10C-20-20-14-48-4-48C6-48 8-20 8 8Z" fill={p.primary} {...st} /><path d="M-4 4C-11-18-8-38-3-38C2-38 3-18 3 4Z" fill={p.belly} opacity=".9" /></Pair>;
    case 'round': return <Pair x={x} y={y}><circle cx="-2" cy="-6" r="15" fill={p.primary} {...st} /><circle cx="-2" cy="-6" r="8" fill={p.belly} /></Pair>;
    case 'fin': return <Pair x={100 - g.sideX + 6} y={g.faceY - 6}><path d="M0 0C-24-18-36-6-32 12C-22 6-10 10 0 14Z" fill={p.secondary} {...st} /><path d="M-8 3-24 0M-8 8-24 9" stroke={lighten(p.secondary, 18)} strokeWidth="2" strokeLinecap="round" /></Pair>;
    case 'leaf': return <Pair x={x} y={y}><path d="M0 8C-26 0-30-26-18-40C-4-26 4-10 0 8Z" fill={p.secondary} {...st} /><path d="M-1 4C-8-10-12-22-17-34" stroke={lighten(p.secondary, 20)} strokeWidth="2" fill="none" strokeLinecap="round" /></Pair>;
    case 'flame': return <Pair x={x} y={y}><path d="M0 10C-18 0-20-20-10-38C-8-26 0-24 2-30C10-16 12 0 0 10Z" fill={p.accent} {...st} /><path d="M0 6C-8 0-10-10-6-20C-2-12 4-10 4-6C4 0 2 4 0 6Z" fill={p.secondary} /></Pair>;
    case 'horn': return <Pair x={x + 4} y={y + 2}><path d="M-4 8C-10-8-14-22-8-34C-2-22 6-8 8 6Z" fill={p.accent} {...st} /><path d="M-6-6-1-8M-8-16-3-18" stroke={darken(p.accent, 15)} strokeWidth="2" strokeLinecap="round" /></Pair>;
    case 'antenna': return <Pair x={x + 8} y={y + 4}><path d="M0 4C-2-10-6-20-10-30" stroke={o} strokeWidth="3.5" fill="none" strokeLinecap="round" /><circle cx="-11" cy="-33" r="7" fill={p.accent} stroke={o} strokeWidth="2.5" /><circle cx="-13" cy="-35" r="2" fill="white" /></Pair>;
    case 'crystal': return <Pair x={x} y={y}><path d="M0 10L-14-10L-6-40L6-12Z" fill={p.accent} {...st} /><path d="M-6-40-4-10 0 10" stroke="white" strokeWidth="1.5" opacity=".7" fill="none" /></Pair>;
    case 'feather': return <Pair x={x} y={y}><path d="M2 8C-14-4-22-22-16-36C-8-24-2-14 2 8Z" fill={p.secondary} {...st} /><path d="M6 6C-2-6-4-18 0-28C6-18 8-8 6 6Z" fill={p.accent} {...st} /></Pair>;
    default: return null;
  }
}

function Mushroom({ g, p, o }: { g: Geo; p: Palette; o: string }) {
  return (
    <g transform={`translate(100 ${g.top + 8})`}>
      <path d="M-50 6C-50-34 50-34 50 6C32 14-32 14-50 6Z" fill={p.accent} stroke={o} strokeWidth="3" />
      <circle cx="-24" cy="-10" r="7" fill="white" opacity=".85" /><circle cx="10" cy="-18" r="5" fill="white" opacity=".85" /><circle cx="30" cy="-4" r="6" fill="white" opacity=".85" />
    </g>
  );
}

function Crest({ a, g, p, o }: { a: ArtSpec; g: Geo; p: Palette; o: string }) {
  const t = g.top;
  const st = { stroke: o, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  switch (a.crest) {
    case 'sprout': return <g transform={`translate(100 ${t + 4})`}><path d="M0 0V-16" stroke={darken(p.secondary, 10)} strokeWidth="4" strokeLinecap="round" /><path d="M0-14C-6-26-22-26-24-18C-16-12-6-12 0-14Z" fill={p.secondary} {...st} /><path d="M0-16C6-30 22-30 24-22C16-14 6-14 0-16Z" fill={lighten(p.secondary, 10)} {...st} /></g>;
    case 'flame': return <g className="cr-flicker"><g transform={`translate(100 ${t + 6})`}><path d="M0 4C-16-2-16-20-6-36C-4-24 2-24 4-30C14-18 14-2 0 4Z" fill={p.accent} {...st} /><path d="M0 0C-6-4-6-12-2-18C0-12 4-12 4-8C4-4 2-1 0 0Z" fill="white" opacity=".7" /></g></g>;
    case 'star': return <g className="cr-float"><g transform={`translate(100 ${t - 10})`}><path d="m0-12 3.5 7.5 8 1-6 5.5 1.6 8L0 6l-7 4 1.6-8-6-5.5 8-1Z" fill={p.accent} {...st} /></g></g>;
    case 'halo': return <g className="cr-float"><ellipse cx="100" cy={t - 14} rx="26" ry="7" fill="none" stroke="#ffd84a" strokeWidth="5" /><ellipse cx="100" cy={t - 14} rx="26" ry="7" fill="none" stroke="#fff6c8" strokeWidth="2" /></g>;
    case 'gem': return <g transform={`translate(100 ${g.faceY - 30})`}><path d="M0-10 8 0 0 10-8 0Z" fill={p.accent} {...st} /><path d="M-3-3 0-6" stroke="white" strokeWidth="2" strokeLinecap="round" /></g>;
    case 'bubble': return <g className="cr-bubbles"><circle cx="112" cy={t - 6} r="7" fill={p.accent} opacity=".75" stroke="white" strokeWidth="1.5" /><circle cx="124" cy={t - 20} r="4.5" fill={p.accent} opacity=".7" stroke="white" strokeWidth="1.2" /><circle cx="116" cy={t - 32} r="3" fill={p.accent} opacity=".6" /></g>;
    case 'spikes': return <g fill={p.secondary} {...st}><path d={`M84 ${t + 6}L90 ${t - 14}L98 ${t + 2}Z`} /><path d={`M96 ${t + 2}L104 ${t - 20}L110 ${t + 2}Z`} /><path d={`M108 ${t + 4}L116 ${t - 12}L120 ${t + 8}Z`} /></g>;
    case 'crown': return <g transform={`translate(100 ${t + 2})`}><path d="M-20 4-24-16-10-6 0-22 10-6 24-16 20 4Z" fill="#ffd84a" stroke="#c9901a" strokeWidth="2.5" strokeLinejoin="round" /><circle cx="0" cy="-4" r="3.5" fill={p.accent} /><circle cx="-12" cy="-2" r="2.2" fill="#ff6fb5" /><circle cx="12" cy="-2" r="2.2" fill="#5fd8ff" /></g>;
    case 'ember': return <g className="cr-float"><g transform={`translate(100 ${t - 20})`}><g><path d="M0 8C-10 4-11-6-4-16C-3-9 2-9 3-13C9-6 9 4 0 8Z" fill={p.accent} {...st} /><circle cx="0" cy="1" r="2.6" fill="white" opacity=".8" /></g></g></g>;
    case 'lure': return <g><path d={`M100 ${t + 4}C102 ${t - 18} 118 ${t - 30} 132 ${t - 22}`} stroke={o} strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx="134" cy={t - 18} r="10" fill={p.accent} opacity=".3" className="cr-core-glow" /><circle cx="134" cy={t - 18} r="6" fill={p.accent} stroke="white" strokeWidth="1.5" /></g>;
    case 'moon': return <g className="cr-float"><g transform={`translate(100 ${t - 8})`}><path d="M6-12A12 12 0 1 0 6 12 9 9 0 1 1 6-12Z" fill={p.accent} {...st} /></g></g>;
    default: return null;
  }
}

function Tail({ a, g, p, o }: { a: ArtSpec; g: Geo; p: Palette; o: string }) {
  const [tx, ty] = g.tail;
  const st = { stroke: o, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  let shape: ReactNode = null;
  switch (a.tail) {
    case 'flame': shape = <><path d="M0 0C20-6 30-24 26-44C36-36 44-20 38-4C34 8 14 12 0 8Z" fill={p.accent} {...st} /><path d="M10 2C22-2 28-12 28-24C34-16 36-6 32 2C28 6 18 8 10 6Z" fill={p.secondary} /></>; break;
    case 'fish': shape = <path d="M0 0C14-4 22-10 30-24C34-10 34 6 30 20C22 8 14 6 0 6Z" fill={p.secondary} {...st} />; break;
    case 'leaf': shape = <><path d="M0 2C10-14 30-26 46-22C40-6 22 8 0 6Z" fill={p.secondary} {...st} /><path d="M4 3C16-6 28-14 40-18" stroke={lighten(p.secondary, 20)} strokeWidth="2" fill="none" /></>; break;
    case 'bolt': shape = <path d="M0 0L18-8L12-18L34-30L26-14L34-12L6 8Z" fill={p.accent} {...st} />; break;
    case 'curl': shape = <path d="M0 0C24 0 34-20 24-30C16-36 8-26 16-20" stroke={p.primary} strokeWidth="10" fill="none" strokeLinecap="round" />; break;
    case 'fluffy': shape = <><circle cx="14" cy="-8" r="14" fill={p.belly} {...st} /><circle cx="26" cy="-20" r="10" fill={p.belly} {...st} /></>; break;
    case 'star': shape = <><path d="M0 0C14-4 22-14 26-26" stroke={p.secondary} strokeWidth="5" fill="none" strokeLinecap="round" /><path d="m28-30 3.5 7.5 8 1-6 5.5 1.6 8L28-12l-7 4 1.6-8-6-5.5 8-1Z" transform="translate(0 -6)" fill={p.accent} {...st} /></>; break;
    case 'spike': shape = <path d="M0-6L36-18L26-6L40 0L4 8Z" fill={p.secondary} {...st} />; break;
    case 'wisp': shape = <path d="M0 0C20 6 30-10 44-8C38 2 26 16 0 10Z" fill={p.secondary} opacity=".8" {...st} />; break;
    default: return null;
  }
  return <g className="cr-tail" style={{ transformOrigin: `${tx}px ${ty}px` }}><g transform={`translate(${tx} ${ty})`}>{shape}</g></g>;
}

function Wings({ a, g, p, o }: { a: ArtSpec; g: Geo; p: Palette; o: string }) {
  const x = 100 - g.sideX + 8, y = g.sideY - 16;
  const st = { stroke: o, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  let shape: ReactNode = null;
  switch (a.wings) {
    case 'small': shape = <path d="M0 0C-20-20-38-14-34 4C-24 2-14 6 0 10Z" fill={p.secondary} {...st} />; break;
    case 'bat': shape = <path d="M0 0C-14-26-40-34-54-20C-46-14-46-6-50 2C-40-2-34 2-32 10C-24 4-12 6 0 12Z" fill={p.secondary} {...st} />; break;
    case 'feather': shape = <><path d="M0 0C-24-30-52-26-58-12C-46-10-50 0-52 6C-40 2-38 10-36 14C-24 8-12 10 0 12Z" fill={p.belly} {...st} /><path d="M-10 0C-22-12-36-14-44-10" stroke={p.secondary} strokeWidth="2" fill="none" opacity=".6" /></>; break;
    case 'fairy': shape = <><ellipse cx="-26" cy="-14" rx="24" ry="13" transform="rotate(-25 -26 -14)" fill={p.accent} opacity=".55" stroke="white" strokeWidth="2" /><ellipse cx="-20" cy="8" rx="15" ry="8" transform="rotate(20 -20 8)" fill={p.accent} opacity=".45" stroke="white" strokeWidth="2" /></>; break;
    case 'fin': shape = <path d="M0 0C-16-24-40-26-46-10C-34-6-30 4-32 12C-20 6-10 8 0 12Z" fill={p.secondary} opacity=".9" {...st} />; break;
    default: return null;
  }
  return <Pair x={x} y={y} cls="cr-wing">{shape}</Pair>;
}

/**
 * Visage EGGVERSE : yeux en amande petits et écartés, cil extérieur, reflet unique,
 * taches de rousseur. (Pas de grands yeux étoilés façon mascotte.)
 */
function Eyes({ a, g, p, o }: { a: ArtSpec; g: Geo; p: Palette; o: string }) {
  const y = g.faceY + 4;
  const gap = a.body === 'blob' ? 27 : 23;
  const one = (x: number, right: boolean) => {
    const out = right ? 1 : -1;
    switch (a.eyes) {
      case 'sleepy':
        return <path d={`M${x - 6} ${y}Q${x} ${y + 5} ${x + 6} ${y}`} stroke={p.eye} strokeWidth="3" fill="none" strokeLinecap="round" />;
      case 'fierce':
        return (<g><ellipse cx={x} cy={y} rx="5.5" ry="7" fill={p.eye} /><circle cx={x + out * 1.5} cy={y - 3} r="1.7" fill="white" />
          <path d={`M${x + out * 8} ${y - 12}L${x - out * 6} ${y - 8}`} stroke={o} strokeWidth="3" strokeLinecap="round" /></g>);
      case 'void':
        return <ellipse cx={x} cy={y} rx="4.5" ry="9" fill={p.eye} />;
      case 'gem':
        return (<g><ellipse cx={x} cy={y} rx="7.5" ry="8.5" fill={p.eye} opacity=".3" /><ellipse cx={x} cy={y} rx="5" ry="6.5" fill={p.eye} />
          <ellipse cx={x} cy={y - 1} rx="2" ry="2.8" fill="white" opacity=".9" /></g>);
      case 'sparkle':
        return (<g><ellipse cx={x} cy={y} rx="6" ry="8" fill={p.eye} /><path d={`M${x - 4} ${y + 4}Q${x} ${y + 7.5} ${x + 4} ${y + 4}`} stroke={p.accent} strokeWidth="2" fill="none" opacity=".8" />
          <circle cx={x + out * 2} cy={y - 3.5} r="2" fill="white" /><circle cx={x - out * 2} cy={y + 1} r="1" fill="white" opacity=".8" />
          <path d={`M${x + out * 5} ${y - 6}l${out * 4} -3`} stroke={o} strokeWidth="2" strokeLinecap="round" /></g>);
      default:
        return (<g><ellipse cx={x} cy={y} rx="5.5" ry="7.5" fill={p.eye} /><circle cx={x + out * 1.8} cy={y - 3} r="1.8" fill="white" />
          <path d={`M${x + out * 5} ${y - 5.5}l${out * 4} -3`} stroke={o} strokeWidth="2" strokeLinecap="round" /></g>);
    }
  };
  return <g className="cr-eyes" style={{ transformOrigin: `100px ${y}px` }}>{one(100 - gap, false)}{one(100 + gap, true)}</g>;
}

function Freckles({ g, p }: { g: Geo; p: Palette }) {
  const y = g.faceY + 15;
  const gap = 33;
  const c = darken(p.primary, 22);
  return (
    <g fill={c} opacity=".55">
      {[-1, 1].map((side) => [[0, 0], [5, -3], [6, 3]].map(([dx, dy], i) => <circle key={`${side}${i}`} cx={100 + side * (gap + dx!)} cy={y + dy!} r="1.6" />))}
    </g>
  );
}

function Mouth({ a, g, p }: { a: ArtSpec; g: Geo; p: Palette }) {
  const y = g.faceY + 15;
  const c = a.eyes === 'void' ? p.eye : darken(p.primary, 45);
  switch (a.mouth) {
    case 'fang': return <g><path d={`M95 ${y}Q100 ${y + 4} 105 ${y}`} stroke={c} strokeWidth="2.4" fill="none" strokeLinecap="round" /><path d={`M101.5 ${y + 1.5}l1.5 3.5 1.4-3Z`} fill="white" /></g>;
    case 'o': return <ellipse cx="100" cy={y + 1} rx="3" ry="3.6" fill={c} />;
    case 'cat': return <path d={`M94 ${y}Q97 ${y + 3.5} 100 ${y}Q103 ${y + 3.5} 106 ${y}`} stroke={c} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    case 'tiny': return <path d={`M97.5 ${y}h5`} stroke={c} strokeWidth="2.4" strokeLinecap="round" />;
    default: return <path d={`M95 ${y}Q100 ${y + 5} 105 ${y}`} stroke={c} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  }
}

/** Œuf d'origine d'une espèce (pour la couleur de son fragment de coquille). */
const nativeCache = new Map<string, EggDef>();
function nativeEggOf(sp: SpeciesDef): EggDef {
  const hit = nativeCache.get(sp.id);
  if (hit) return hit;
  let egg: EggDef | undefined = sp.art.nativeEgg ? EGGS[sp.art.nativeEgg] : undefined;
  egg ??= Object.values(EGGS).find((e) => e.pool.some((x) => x.species === sp.id));
  if (!egg) {
    const parent = SPECIES_LIST.find((s) => s.evolutions.some((e) => e.to === sp.id));
    egg = parent ? nativeEggOf(parent) : EGGS.legendaire!;
  }
  nativeCache.set(sp.id, egg);
  return egg;
}

const CAP_W: Record<BodyShape, number> = { round: 42, pear: 38, drop: 24, blob: 48, tall: 38, ghost: 42, gem: 36, serpent: 38 };
const BASE_W: Record<BodyShape, number> = { round: 62, pear: 58, drop: 60, blob: 74, tall: 56, ghost: 62, gem: 64, serpent: 66 };

function zigzag(x1: number, x2: number, y: number, teeth: number, depth: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= teeth; i++) pts.push(`L${(x1 + ((x2 - x1) * i) / teeth).toFixed(1)} ${i % 2 ? y - depth : y}`);
  return pts.join('');
}

function ShellSpots({ egg, cx, cy, spread }: { egg: EggDef; cx: number; cy: number; spread: number }) {
  return (
    <g fill={egg.visual.secondary} opacity=".75">
      <circle cx={cx - spread * 0.5} cy={cy} r="4" /><circle cx={cx + spread * 0.15} cy={cy + 5} r="3" /><circle cx={cx + spread * 0.6} cy={cy - 2} r="3.6" />
    </g>
  );
}

/** Signature EGGVERSE : chaque créature garde un morceau de la coquille dont elle est née. */
function Shell({ style, g, a, egg }: { style: ShellStyle; g: Geo; a: ArtSpec; egg: EggDef }) {
  const base = egg.visual.base;
  const line = darken(base, 28);
  if (style === 'base') {
    const w = BASE_W[a.body];
    const top = Math.max(g.bottom - 26, g.faceY + 24);
    const d = `M${100 - w} ${top}${zigzag(100 - w, 100 + w, top, 10, 8)}C${100 + w + 2} ${g.bottom + 20} ${100 - w - 2} ${g.bottom + 20} ${100 - w} ${top}Z`;
    return (
      <g className="cr-shell">
        <path d={d} fill={base} stroke={line} strokeWidth="2.5" strokeLinejoin="round" />
        <ShellSpots egg={egg} cx={100} cy={top + 16} spread={w} />
        <path d={`M${100 - w + 10} ${top + 10}Q${100 - w + 14} ${g.bottom + 2} ${100 - w + 30} ${g.bottom + 8}`} stroke="white" strokeWidth="3" fill="none" opacity=".45" strokeLinecap="round" />
      </g>
    );
  }
  if (style === 'cap') {
    const w = CAP_W[a.body];
    const t = g.top;
    const by = t + 18;
    const d = `M${100 - w} ${by}C${100 - w} ${t - 8} ${100 - w * 0.5} ${t - 15} 100 ${t - 15}C${100 + w * 0.5} ${t - 15} ${100 + w} ${t - 8} ${100 + w} ${by}${zigzag(100 + w, 100 - w, by, 8, 7)}Z`;
    return (
      <g className="cr-shell" transform={`rotate(-9 100 ${t})`}>
        <path d={d} fill={base} stroke={line} strokeWidth="2.5" strokeLinejoin="round" />
        <ShellSpots egg={egg} cx={100} cy={t} spread={w * 0.9} />
        <path d={`M${100 - w * 0.55} ${t + 2}Q${100 - w * 0.45} ${t - 9} ${100 - w * 0.1} ${t - 11}`} stroke="white" strokeWidth="3" fill="none" opacity=".5" strokeLinecap="round" />
      </g>
    );
  }
  return null;
}

/** Le noyau : gemme élémentaire sur la poitrine (dans un éclat de coquille chez les adultes). */
function Core({ x, y, color, shard, egg }: { x: number; y: number; color: string; shard: boolean; egg: EggDef }) {
  return (
    <g>
      {shard && (
        <g transform={`translate(${x} ${y}) scale(.72) translate(${-x} ${-y})`}>
          <path d={`M${x - 20} ${y - 16}Q${x} ${y - 6} ${x + 20} ${y - 16}`} stroke={darken(egg.visual.base, 35)} strokeWidth="1.8" fill="none" />
          <path d={`M${x - 10} ${y - 8}L${x - 4} ${y - 12}L${x + 2} ${y - 8}L${x + 8} ${y - 12}L${x + 11} ${y - 6}L${x + 7} ${y + 10}L${x - 7} ${y + 11}Z`} fill={egg.visual.base} stroke={darken(egg.visual.base, 28)} strokeWidth="2" strokeLinejoin="round" />
        </g>
      )}
      <circle cx={x} cy={y} r="9" fill={color} opacity=".28" className="cr-core-glow" />
      <path d={`M${x} ${y - 6.5}L${x + 4.5} ${y}L${x} ${y + 6.5}L${x - 4.5} ${y}Z`} fill={color} stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx={x - 1} cy={y - 2} r="1.2" fill="white" />
    </g>
  );
}

function Pattern({ a, g, p }: { a: ArtSpec; g: Geo; p: Palette }) {
  const t = g.top, b = g.bottom;
  const belly = <ellipse cx="100" cy={b - 34} rx={a.body === 'blob' ? 46 : 34} ry="27" fill={p.belly} />;
  switch (a.pattern) {
    case 'belly': return belly;
    case 'spots': return <g>{belly}<g fill={p.secondary} opacity=".55"><circle cx="70" cy={t + 34} r="8" /><circle cx="132" cy={t + 44} r="6" /><circle cx="118" cy={t + 20} r="4" /><circle cx="56" cy={b - 52} r="6" /><circle cx="146" cy={b - 50} r="8" /></g></g>;
    case 'stripes': return <g>{belly}<g stroke={p.secondary} strokeWidth="6" strokeLinecap="round" fill="none" opacity=".6"><path d={`M82 ${t + 2}q4 12 0 22`} /><path d={`M100 ${t - 2}v26`} /><path d={`M118 ${t + 2}q-4 12 0 22`} /><path d={`M46 ${b - 70}q12 4 18 14`} /><path d={`M154 ${b - 70}q-12 4-18 14`} /></g></g>;
    case 'scales': return <g>{belly}<g stroke={p.secondary} strokeWidth="2.5" fill="none" opacity=".5">{[0, 1, 2].map((r) => [0, 1, 2, 3].map((i) => <path key={`${r}${i}`} d={`M${76 + i * 14 + (r % 2) * 7} ${b - 50 + r * 12}q7 8 14 0`} />))}</g></g>;
    case 'stars': return <g fill={p.accent} opacity=".9">{[[68, t + 30, 1], [130, t + 40, 0.8], [116, t + 18, 0.6], [60, b - 46, 0.9], [142, b - 54, 1.1], [100, b - 30, 0.7]].map(([x, y, s], i) => <path key={i} transform={`translate(${x} ${y}) scale(${s})`} d="M0-6 1.6-1.6 6 0 1.6 1.6 0 6-1.6 1.6-6 0-1.6-1.6Z" />)}</g>;
    case 'cracks': return <g>{belly}<g stroke={p.accent} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".85"><path d={`M58 ${t + 36}l10 6-3 9 9 5`} /><path d={`M146 ${t + 30}l-9 8 5 8`} /><path d={`M52 ${b - 44}l10-4 4 8`} /><path d={`M148 ${b - 50}l-8 2-2 9`} /></g></g>;
    case 'runes': return <g>{belly}<g stroke={p.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".75"><path d={`M60 ${t + 44}l6-10 6 10M63 ${t + 40}h6`} /><path d={`M132 ${t + 36}v12l6-6`} /><circle cx="140" cy={b - 52} r="5" /><path d={`M56 ${b - 58}h10M61 ${b - 63}v10`} /></g></g>;
    default: return null;
  }
}

function Overlays({ overlays, g, p, clip, uid }: { overlays: Set<Overlay>; g: Geo; p: Palette; clip: string; uid: string }) {
  const out: ReactNode[] = [];
  if (overlays.has('facets')) out.push(<g key="facets" clipPath={`url(#${clip})`} fill="white" opacity=".32"><path d={`M44 ${g.top + 40}L100 ${g.faceY - 10}L70 ${g.bottom}Z`} /><path d={`M156 ${g.top + 30}L120 ${g.faceY + 20}L160 ${g.bottom - 30}Z`} /><path d={`M80 ${g.top}L120 ${g.top}L100 ${g.top + 30}Z`} /></g>);
  if (overlays.has('cracks')) out.push(<g key="cracks" clipPath={`url(#${clip})`} stroke={p.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" filter={`url(#${uid}-glow)`} className="cr-pulse"><path d={`M56 ${g.top + 40}l12 8-4 10 10 6`} /><path d={`M150 ${g.faceY + 10}l-10 6 4 10-8 8`} /><path d={`M90 ${g.bottom - 10}l6-12 8 4 4-10`} /></g>);
  if (overlays.has('runes')) out.push(<g key="runes" stroke="#e8c070" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".85" className="cr-pulse"><path d={`M64 ${g.faceY + 26}h8l-4 8z`} /><path d={`M132 ${g.faceY + 22}l4 8 4-8M136 ${g.faceY + 30}v6`} /><circle cx="100" cy={g.top + 16} r="4" /></g>);
  if (overlays.has('frost')) out.push(<g key="frost" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity=".95">{[[70, g.top + 10], [132, g.top + 16], [48, g.faceY + 20], [152, g.faceY + 26]].map(([x, y], i) => <path key={i} transform={`translate(${x} ${y})`} d="M0-6V6M-5-3 5 3M-5 3 5-3" />)}</g>);
  if (overlays.has('flowers')) out.push(<g key="flowers">{[[78, g.top + 4, 1], [122, g.top + 8, 0.8]].map(([x, y, s], i) => <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>{[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-7" rx="5" ry="7" fill="#ff9fd0" stroke="white" strokeWidth="1" transform={`rotate(${r})`} />)}<circle r="4" fill="#ffd84a" /></g>)}</g>);
  if (overlays.has('thirdEye')) out.push(<g key="eye3"><ellipse cx="100" cy={g.faceY - 24} rx="7" ry="8" fill="#b8ff6a" stroke="#3a2440" strokeWidth="2" /><ellipse cx="100" cy={g.faceY - 23} rx="2.5" ry="5" fill="#2a1a10" /></g>);
  if (overlays.has('sparkles')) out.push(<g key="sparkles" fill="#fffbe0" className="cr-twinkle">{[[40, g.top + 10], [162, g.top + 30], [36, g.bottom - 30], [168, g.bottom - 50]].map(([x, y], i) => <path key={i} style={{ animationDelay: `${i * 0.4}s` }} transform={`translate(${x} ${y})`} d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2Z" />)}</g>);
  if (overlays.has('embers')) out.push(<g key="embers" fill="#ffb03d">{[60, 88, 116, 140].map((x, i) => <circle key={i} className="cr-ember" style={{ animationDelay: `${i * 0.5}s` }} cx={x} cy={g.top + 10} r="3" />)}</g>);
  if (overlays.has('wisps')) out.push(<g key="wisps" fill="none" stroke="#d9cfff" strokeWidth="3" strokeLinecap="round" opacity=".7" className="cr-float"><path d={`M60 ${g.bottom + 2}q-10 8 0 16`} /><path d={`M140 ${g.bottom}q10 8 0 16`} /></g>);
  return <>{out}</>;
}

export interface CreatureArtProps {
  speciesId: string;
  mutations?: string[];
  hue?: number;
  size?: number;
  anim?: 'idle' | 'walk' | 'attack' | 'sleep' | 'none';
  silhouette?: boolean;
  /** Graine de désynchronisation des animations. */
  seed?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/** Ancien rendu vectoriel, gardé en secours si une illustration ne charge pas. */
function CreatureVector({ speciesId, mutations = [], hue = 0, size = 160, anim = 'idle', silhouette = false, seed, className, style, title }: CreatureArtProps) {
  const rid = useId().replace(/:/g, '');
  const sp = SPECIES[speciesId];
  if (!sp) return null;
  const a = sp.art;
  const g = GEO[a.body];
  const look = resolveLook(a.palette, silhouette ? [] : mutations, silhouette ? 0 : hue);
  const p: Palette = silhouette ? { primary: SIL, secondary: SIL, accent: SIL, belly: SIL, eye: SIL } : look.palette;
  const o = silhouette ? SIL : darken(p.primary, 30);
  const shellStyle: ShellStyle = a.shell ?? (sp.stage === 'bebe' ? 'base' : sp.stage === 'juvenile' ? 'cap' : 'shard');
  const egg = nativeEggOf(sp);
  // Bébés : noyau serti dans la coquille ; sinon sur la poitrine.
  const coreY = shellStyle === 'base' ? g.bottom - 10 : g.faceY + 32;
  const crestGeo = shellStyle === 'cap' ? { ...g, top: g.top - 14 } : g;
  const clip = `${rid}-clip`;
  const delay = seed ? -((hashString(seed) % 4000) / 1000) : 0;
  const bodyFill = silhouette ? SIL : look.cosmicBody ? `url(#${rid}-cosmos)` : `url(#${rid}-body)`;
  const auraColor = !silhouette && (look.glow || a.aura);

  return (
    <svg
      viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={title ?? sp.name}
      className={`creature anim-${anim} ${silhouette ? 'is-silhouette' : ''} ${className ?? ''}`}
      style={{ ...style, ['--cr-delay' as string]: `${delay}s` }}
    >
      <defs>
        <radialGradient id={`${rid}-body`} cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor={lighten(p.primary, 12)} />
          <stop offset=".55" stopColor={p.primary} />
          <stop offset="1" stopColor={darken(p.primary, 8)} />
        </radialGradient>
        <radialGradient id={`${rid}-aura`}>
          <stop offset="0" stopColor={auraColor || '#fff'} stopOpacity=".55" />
          <stop offset="1" stopColor={auraColor || '#fff'} stopOpacity="0" />
        </radialGradient>
        <filter id={`${rid}-glow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        {look.cosmicBody && (
          <pattern id={`${rid}-cosmos`} patternUnits="userSpaceOnUse" width="200" height="200">
            <rect width="200" height="200" fill="#1d1650" />
            <circle cx="70" cy="80" r="60" fill="#5a3ad6" opacity=".55" />
            <circle cx="140" cy="140" r="50" fill="#d0459f" opacity=".35" />
            {[[40, 60], [90, 50], [150, 70], [60, 130], [120, 110], [160, 150], [100, 160], [75, 100], [135, 90]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.2} fill="white" />)}
          </pattern>
        )}
        <clipPath id={clip}><path d={g.d} /></clipPath>
        {silhouette && (
          <filter id={`${rid}-sil`}><feFlood floodColor={SIL} /><feComposite in2="SourceGraphic" operator="in" /></filter>
        )}
      </defs>

      {auraColor && <circle cx="100" cy="112" r="96" fill={`url(#${rid}-aura)`} className="cr-aura" />}
      <ellipse cx="100" cy={g.bottom + 10} rx="50" ry="8" fill="#2b1e5a" opacity={silhouette ? 0.12 : 0.16} className="cr-shadow" />

      <g className="cr-root" style={{ transformOrigin: `100px ${g.bottom}px` }} filter={silhouette ? `url(#${rid}-sil)` : undefined}>
        <g className="cr-body" style={{ transformOrigin: `100px ${g.bottom}px` }} opacity={look.opacity} filter={look.opacity < 1 ? `url(#${rid}-glow)` : undefined}>
          <Wings a={a} g={g} p={p} o={o} />
          <Tail a={a} g={g} p={p} o={o} />
          {a.ears !== 'mushroom' && <Ears a={a} g={g} p={p} o={o} />}
          {a.crest === 'halo' && <Crest a={a} g={crestGeo} p={p} o={o} />}
          {a.body === 'serpent' && <ellipse cx="100" cy={g.bottom} rx="64" ry="17" fill={p.secondary} stroke={o} strokeWidth="3" />}
          {a.feet && shellStyle !== 'base' && <g fill={p.secondary} stroke={o} strokeWidth="2.5"><ellipse cx="76" cy={g.bottom - 2} rx="14" ry="9" /><ellipse cx="124" cy={g.bottom - 2} rx="14" ry="9" /></g>}

          <path d={g.d} fill={bodyFill} stroke={o} strokeWidth={a.body === 'gem' ? 5 : 2.6} strokeLinejoin="round" />
          {!silhouette && <g clipPath={`url(#${clip})`}><Pattern a={a} g={g} p={p} /><ellipse cx="78" cy={g.top + 26} rx="18" ry="10" fill="white" opacity=".28" transform={`rotate(-25 78 ${g.top + 26})`} /></g>}
          {a.ears === 'mushroom' && <Mushroom g={g} p={p} o={o} />}
          <Shell style={shellStyle} g={g} a={a} egg={egg} />
          {a.crest !== 'halo' && <Crest a={a} g={crestGeo} p={p} o={o} />}

          {!silhouette && (
            <g className="cr-face">
              <Freckles g={g} p={p} />
              <Eyes a={anim === 'sleep' ? { ...a, eyes: 'sleepy' } : a} g={g} p={p} o={o} />
              <Mouth a={a} g={g} p={p} />
            </g>
          )}
          {!silhouette && <Core x={100} y={coreY} color={ELEMENTS[sp.element].color} shard={shellStyle === 'shard'} egg={egg} />}
          {!silhouette && <Overlays overlays={look.overlays} g={g} p={p} clip={clip} uid={rid} />}
        </g>
      </g>
      {anim === 'sleep' && !silhouette && <g className="cr-zzz" fill="#7b5cff" fontFamily="Fredoka, sans-serif" fontWeight="700"><text x="150" y={g.top + 6} fontSize="18">z</text><text x="162" y={g.top - 10} fontSize="13">z</text></g>}
    </svg>
  );
}

const SIL = '#2b2350';
const STAGE_SCALE: Record<string, number> = { bebe: 0.8, juvenile: 0.9, adulte: 1 };

/** Positions fixes des particules (en % de la boîte), pour un rendu stable. */
const SPOTS = [[18, 30], [82, 24], [12, 66], [88, 60], [50, 10], [30, 84], [70, 80], [60, 40]];

function Particles({ kind }: { kind: Particle }) {
  const n = kind === 'sparkles' ? 6 : kind === 'wisps' ? 3 : 7;
  return (
    <div className={`ci-pt ci-pt-${kind}`} aria-hidden="true">
      {SPOTS.slice(0, n).map(([x, y], i) => <i key={i} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i * 0.37) % 2.4}s` }} />)}
    </div>
  );
}

function CreaturePainted({ speciesId, mutations = [], hue = 0, size = 160, anim = 'idle', silhouette = false, seed, className, style, title, onFail }: CreatureArtProps & { onFail: () => void }) {
  const sp = SPECIES[speciesId]!;
  const src = creatureSrc(speciesId);
  const fx = resolveFx(silhouette ? [] : mutations, silhouette ? 0 : hue);
  const delay = seed ? -((hashString(seed) % 4000) / 1000) : 0;
  const aura = !silhouette && (fx.glow || sp.art.aura);
  const scale = STAGE_SCALE[sp.stage] ?? 1;
  const mask = maskStyle(src);
  return (
    <div
      role="img" aria-label={title ?? sp.name}
      className={`creature ci anim-${anim} ${silhouette ? 'is-silhouette' : ''} ${fx.classes.join(' ')} ${className ?? ''}`}
      style={{ width: size, height: size, ...style, ['--cr-delay' as string]: `${delay}s`, ['--ci-scale' as string]: scale, ['--glow' as string]: aura || 'transparent' }}
    >
      {aura && <div className="ci-aura" />}
      <div className="ci-shadow" />
      <div className="ci-root">
        <div className="ci-body" style={{ opacity: fx.opacity }}>
          {silhouette ? (
            <div className="ci-sil" style={{ ...mask, background: SIL }} />
          ) : (
            <>
              <img src={src} alt="" draggable={false} decoding="async" loading="lazy" onError={onFail} style={{ filter: fx.filter }} />
              {fx.layers.map((l, i) => (
                <div
                  key={i}
                  className={`ci-layer ${l.drift ? 'ci-drift' : ''} ${l.pulse ? 'ci-pulse' : ''}`}
                  style={{ ...mask, mixBlendMode: l.blend, opacity: l.opacity, background: l.tex ? `url("${texSrc(l.tex)}") center / 70% repeat` : l.color }}
                />
              ))}
              {fx.sheen && <div className={`ci-sheen ci-sheen-${fx.sheen}`} style={mask} />}
            </>
          )}
        </div>
      </div>
      {!silhouette && fx.particles.map((k) => <Particles key={k} kind={k} />)}
      {anim === 'sleep' && !silhouette && <div className="ci-zzz" aria-hidden="true"><span>z</span><span>z</span></div>}
    </div>
  );
}

function CreatureArtImpl(props: CreatureArtProps) {
  const [failed, setFailed] = useState(false);
  if (!SPECIES[props.speciesId]) return null;
  if (failed) return <CreatureVector {...props} />;
  return <CreaturePainted {...props} onFail={() => setFailed(true)} />;
}

export const CreatureArt = memo(CreatureArtImpl);
