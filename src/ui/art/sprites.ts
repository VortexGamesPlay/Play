/** Chemins des illustrations peintes (public/art). */
const BASE = (import.meta.env?.BASE_URL as string | undefined) ?? '/';

export const creatureSrc = (speciesId: string) => `${BASE}art/creatures/${speciesId}.webp`;
export const eggSrc = (eggType: string) => `${BASE}art/eggs/${eggType}.webp`;
export const bgSrc = (name: string) => `${BASE}art/bg/${name}.webp`;
export const texSrc = (name: string) => `${BASE}art/tex/${name}.webp`;

/** Style CSS d'un calque découpé à la forme exacte de l'illustration. */
export const maskStyle = (src: string) => {
  const m = `url("${src}")`;
  return { WebkitMaskImage: m, maskImage: m, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' } as const;
};
