export type FabledLabId = 'alkemist' | 'scribe' | 'tesseract' | 'logix';

export interface FabledLab {
  id: FabledLabId;
  name: string;
  shortName: string;
  path: string;
  legacyPath: string;
  summary: string;
  atmosphere: FabledLabAtmosphere;
  sourceRepo?: string;
}

export interface FabledLabAtmosphere {
  base: 'pink' | 'ultraviolet' | 'orange' | 'electric-blue';
  accent: string;
  glow: string;
  deep: string;
  lavaStart: string;
  lavaMid: string;
  lavaEnd: string;
}

export const FABLED_LABS: FabledLab[] = [
  {
    id: 'alkemist',
    name: 'FabledLabs: Alkemist',
    shortName: 'Alkemist',
    path: '/alkemist',
    legacyPath: '/build',
    summary: 'Electron coding workspace with AI integration, sandboxed execution, and design previews.',
    atmosphere: {
      base: 'pink',
      accent: '#ff00ad',
      glow: 'rgba(255, 0, 173, 0.44)',
      deep: '#160012',
      lavaStart: '#87004f',
      lavaMid: '#ff00ad',
      lavaEnd: '#ff72dc'
    },
    sourceRepo: 'Alkemist-copilot-create-alkemist-ide-repo'
  },
  {
    id: 'scribe',
    name: 'FabledLabs: Scribe',
    shortName: 'Scribe',
    path: '/scribe',
    legacyPath: '/school',
    summary: 'Coursework studio for guided lessons, coaching, and practical exercises from existing FableCode School.',
    atmosphere: {
      base: 'ultraviolet',
      accent: '#9b5cff',
      glow: 'rgba(155, 92, 255, 0.44)',
      deep: '#10001f',
      lavaStart: '#3d087f',
      lavaMid: '#8f39ff',
      lavaEnd: '#d6b2ff'
    }
  },
  {
    id: 'tesseract',
    name: 'FabledLabs: Tesseract',
    shortName: 'Tesseract',
    path: '/tesseract',
    legacyPath: '/design',
    summary: '3D design workspace for character development and floor plan blueprint workflows.',
    atmosphere: {
      base: 'orange',
      accent: '#ff7a1a',
      glow: 'rgba(255, 122, 26, 0.42)',
      deep: '#1f0800',
      lavaStart: '#8f2b00',
      lavaMid: '#ff7a1a',
      lavaEnd: '#ffd166'
    }
  },
  {
    id: 'logix',
    name: 'FabledLabs: Logix',
    shortName: 'Logix',
    path: '/logix',
    legacyPath: '/blocks',
    summary: 'Visual block coding and logic chains inspired by FabledFlow, rebuilt for the FabledLabs platform.',
    atmosphere: {
      base: 'electric-blue',
      accent: '#19b9ff',
      glow: 'rgba(25, 185, 255, 0.42)',
      deep: '#001521',
      lavaStart: '#005c8f',
      lavaMid: '#19b9ff',
      lavaEnd: '#9edfff'
    },
    sourceRepo: 'FabledFlow'
  }
];

export const FABLED_LABS_BY_ID = Object.fromEntries(FABLED_LABS.map((lab) => [lab.id, lab])) as Record<FabledLabId, FabledLab>;

export function labForPath(pathname: string): FabledLab {
  return FABLED_LABS.find((lab) => pathname.startsWith(lab.path) || pathname.startsWith(lab.legacyPath)) ?? FABLED_LABS[0];
}
