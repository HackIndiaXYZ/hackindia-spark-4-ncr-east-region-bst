import type { GraphNode } from "../types";

export type IconTheme = "dark" | "light";

type IconMap = Record<string, string>;

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function iconTemplate(inner: string, theme: IconTheme) {
  const ring = theme === "dark" ? "#e6f1ff" : "#0f172a";
  const shadow = theme === "dark" ? "rgba(2, 6, 23, 0.55)" : "rgba(15, 23, 42, 0.2)";
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
    <defs>
      <filter id='s' x='-50%' y='-50%' width='200%' height='200%'>
        <feDropShadow dx='0' dy='2' stdDeviation='2' flood-color='${shadow}'/>
      </filter>
    </defs>
    <circle cx='32' cy='32' r='29' fill='none' stroke='${ring}' stroke-opacity='0.25' stroke-width='2'/>
    <g filter='url(#s)'>${inner}</g>
  </svg>`;
}

function createSvgs(theme: IconTheme): IconMap {
  return {
    "type:domain": iconTemplate("<circle cx='32' cy='32' r='20' fill='#22c55e'/><path d='M18 32h28M32 18v28' stroke='white' stroke-width='3' stroke-linecap='round'/>", theme),
    "type:concept": iconTemplate("<circle cx='32' cy='32' r='20' fill='#fb923c'/><path d='M23 33c0-6 4-10 9-10 6 0 9 4 9 9 0 4-2 6-4 8-1 1-2 2-2 4h-6c0-2-1-3-2-4-2-2-4-4-4-7z' fill='white'/><rect x='28' y='46' width='8' height='3' rx='1.5' fill='white'/>", theme),
    "type:stack": iconTemplate("<circle cx='32' cy='32' r='20' fill='#a855f7'/><rect x='20' y='20' width='24' height='8' rx='3' fill='white'/><rect x='20' y='30' width='24' height='8' rx='3' fill='white' fill-opacity='0.9'/><rect x='20' y='40' width='24' height='8' rx='3' fill='white' fill-opacity='0.8'/>", theme),
    "type:project": iconTemplate("<circle cx='32' cy='32' r='20' fill='#06b6d4'/><path d='M18 29l14-11 14 11-14 17-14-17z' fill='white'/><path d='M26 30h12' stroke='#06b6d4' stroke-width='2' stroke-linecap='round'/>", theme),
    "type:owner": iconTemplate("<circle cx='32' cy='32' r='20' fill='#14b8a6'/><circle cx='32' cy='27' r='7' fill='white'/><path d='M20 45c3-6 8-9 12-9s9 3 12 9' stroke='white' stroke-width='4' stroke-linecap='round'/>", theme),
    "type:learning": iconTemplate("<circle cx='32' cy='32' r='20' fill='#ef4444'/><path d='M24 22h16v20l-8-5-8 5z' fill='white'/><path d='M28 29h8M28 33h8' stroke='#ef4444' stroke-width='2' stroke-linecap='round'/>", theme),
    "type:file": iconTemplate("<circle cx='32' cy='32' r='20' fill='#3b82f6'/><path d='M24 18h12l8 8v20H24z' fill='white'/><path d='M36 18v8h8' fill='none' stroke='#3b82f6' stroke-width='2'/>", theme),
    "lang:python": iconTemplate("<circle cx='32' cy='32' r='20' fill='#3776ab'/><path d='M25 24h9a4 4 0 0 1 4 4v4h-9a4 4 0 0 1-4-4z' fill='#ffd343'/><circle cx='31' cy='27.5' r='1.4' fill='#1f2937'/><path d='M39 40h-9a4 4 0 0 1-4-4v-4h9a4 4 0 0 1 4 4z' fill='#3776ab'/><circle cx='33' cy='36.5' r='1.4' fill='white'/>", theme),
    "lang:typescript": iconTemplate("<circle cx='32' cy='32' r='20' fill='#3178c6'/><path d='M22 24h20v16H22z' fill='white'/><path d='M26 29h10M30 29v8M35 32c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3 1-3 2 1 2 3 2 3-1 3-2' stroke='#3178c6' stroke-width='2' fill='none' stroke-linecap='round'/>", theme),
    "lang:javascript": iconTemplate("<circle cx='32' cy='32' r='20' fill='#f7df1e'/><path d='M22 22h20v20H22z' fill='#1f2937'/><path d='M29 28v8c0 2-1 3-3 3-1 0-3-1-3-2' stroke='#f7df1e' stroke-width='2' fill='none' stroke-linecap='round'/><path d='M34 37c1 1 2 2 4 2 1 0 3-1 3-2 0-2-1-2-3-3-2-1-4-2-4-5 0-2 2-4 5-4 2 0 4 1 5 3' stroke='#f7df1e' stroke-width='2' fill='none' stroke-linecap='round'/>", theme),
    "lang:react": iconTemplate("<circle cx='32' cy='32' r='20' fill='#0f172a'/><circle cx='32' cy='32' r='3.5' fill='#61dafb'/><ellipse cx='32' cy='32' rx='12' ry='5' stroke='#61dafb' stroke-width='2' fill='none'/><ellipse cx='32' cy='32' rx='12' ry='5' stroke='#61dafb' stroke-width='2' fill='none' transform='rotate(60 32 32)'/><ellipse cx='32' cy='32' rx='12' ry='5' stroke='#61dafb' stroke-width='2' fill='none' transform='rotate(120 32 32)'/>", theme),
    "lang:java": iconTemplate("<circle cx='32' cy='32' r='20' fill='#f97316'/><path d='M22 41h20' stroke='white' stroke-width='3' stroke-linecap='round'/><path d='M25 39c0-4 3-6 7-6s7 2 7 6' stroke='white' stroke-width='2.5' fill='none'/><path d='M30 22c4 2-2 4 2 7M35 21c4 2-2 4 2 7' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/>", theme),
    "lang:go": iconTemplate("<circle cx='32' cy='32' r='20' fill='#00add8'/><path d='M20 32h24' stroke='white' stroke-width='4' stroke-linecap='round'/><circle cx='26' cy='32' r='2.2' fill='#00add8'/><circle cx='38' cy='32' r='2.2' fill='#00add8'/><path d='M24 39c2 2 4 3 8 3s6-1 8-3' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/>", theme),
    "lang:rust": iconTemplate("<circle cx='32' cy='32' r='20' fill='#111827'/><path d='M32 18l4 3 5-1 1 5 4 3-4 3-1 5-5-1-4 3-4-3-5 1-1-5-4-3 4-3 1-5 5 1z' fill='#f59e0b'/><circle cx='32' cy='32' r='6' fill='white'/><circle cx='32' cy='32' r='2.5' fill='#111827'/>", theme),
    "lang:docs": iconTemplate("<circle cx='32' cy='32' r='20' fill='#64748b'/><path d='M23 18h14l6 6v22H23z' fill='white'/><path d='M37 18v6h6M27 29h12M27 34h12M27 39h8' stroke='#64748b' stroke-width='2' stroke-linecap='round'/>", theme),
    "lang:config": iconTemplate("<circle cx='32' cy='32' r='20' fill='#334155'/><circle cx='32' cy='32' r='7' fill='white'/><path d='M32 20v4M32 40v4M20 32h4M40 32h4M23.5 23.5l2.8 2.8M37.7 37.7l2.8 2.8M40.5 23.5l-2.8 2.8M23.5 40.5l2.8-2.8' stroke='white' stroke-width='2' stroke-linecap='round'/>", theme),
  };
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load icon"));
    image.src = url;
  });
}

export function resolveGraphIconKey(node: GraphNode): string {
  if (node.type !== "file") {
    return `type:${node.type}`;
  }
  const language = String(node.metadata.language ?? "").toLowerCase();
  return `lang:${language}`;
}

export async function loadGraphIcons(theme: IconTheme) {
  const svgMap = createSvgs(theme);
  const loaded = await Promise.all(
    Object.entries(svgMap).map(async ([key, svg]) => {
      const image = await loadImage(svgDataUrl(svg));
      return [key, image] as const;
    }),
  );

  return Object.fromEntries(loaded) as Record<string, HTMLImageElement>;
}
