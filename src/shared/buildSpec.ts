export type PartKind = 'sphere' | 'capsule' | 'box' | 'cylinder';

export interface PartTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface PartMaterial {
  color: string;
  roughness: number;
  metalness: number;
  wireframe?: boolean;
}

export interface PartGeometry {
  // sphere:   [radius, widthSegments, heightSegments]
  // capsule:  [radius, length, capSegments, radialSegments]
  // box:      [width, height, depth]
  // cylinder: [radiusTop, radiusBottom, height, radialSegments]
  args: number[];
}

export interface Part {
  id: string;
  name: string;
  kind: PartKind;
  geometry: PartGeometry;
  transform: PartTransform;
  material: PartMaterial;
  parentId?: string;
}

export interface BuildSpec {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  parts: Part[];
  referenceImageDataUrl?: string;
}

// Reproduces the hardcoded CharacterMesh from DesignPanel.tsx exactly.
export const DEFAULT_HUMANOID: BuildSpec = {
  id: 'default-humanoid',
  name: 'Default Humanoid',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  parts: [
    {
      id: 'head',
      name: 'Head',
      kind: 'sphere',
      geometry: { args: [0.28, 32, 32] },
      transform: { position: [0, 1.58, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      material: { color: '#c045b0', roughness: 0.28, metalness: 0.55 },
    },
    {
      id: 'body',
      name: 'Body',
      kind: 'capsule',
      geometry: { args: [0.2, 0.66, 8, 16] },
      transform: { position: [0, 0.92, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      material: { color: '#c045b0', roughness: 0.28, metalness: 0.55 },
    },
    {
      id: 'arm-left',
      name: 'Left Arm',
      kind: 'capsule',
      geometry: { args: [0.08, 0.44, 4, 8] },
      transform: { position: [-0.4, 0.98, 0], rotation: [0, 0, 0.42], scale: [1, 1, 1] },
      material: { color: '#c045b0', roughness: 0.28, metalness: 0.55 },
    },
    {
      id: 'arm-right',
      name: 'Right Arm',
      kind: 'capsule',
      geometry: { args: [0.08, 0.44, 4, 8] },
      transform: { position: [0.4, 0.98, 0], rotation: [0, 0, -0.42], scale: [1, 1, 1] },
      material: { color: '#c045b0', roughness: 0.28, metalness: 0.55 },
    },
    {
      id: 'leg-left',
      name: 'Left Leg',
      kind: 'capsule',
      geometry: { args: [0.1, 0.52, 4, 8] },
      transform: { position: [-0.14, 0.33, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      material: { color: '#c045b0', roughness: 0.28, metalness: 0.55 },
    },
    {
      id: 'leg-right',
      name: 'Right Leg',
      kind: 'capsule',
      geometry: { args: [0.1, 0.52, 4, 8] },
      transform: { position: [0.14, 0.33, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      material: { color: '#c045b0', roughness: 0.28, metalness: 0.55 },
    },
  ],
};

export function loadSpecFromStorage(): BuildSpec | null {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('fablecode:designSpec:'));
    if (keys.length === 0) return null;
    // Load the most recently updated one
    let latest: BuildSpec | null = null;
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const spec = JSON.parse(raw) as BuildSpec;
      if (!spec.id || !spec.parts) continue;
      if (!latest || spec.updatedAt > latest.updatedAt) latest = spec;
    }
    return latest;
  } catch {
    return null;
  }
}

export function saveSpecToStorage(spec: BuildSpec): void {
  const key = `fablecode:designSpec:${spec.id}`;
  localStorage.setItem(key, JSON.stringify(spec));
}

export function downloadSpecAsJson(spec: BuildSpec): void {
  const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const maybeDocument = (globalThis as {
    document?: { createElement?: (tag: string) => { href: string; download: string; click: () => void } };
  }).document;
  const createElement = maybeDocument?.createElement;
  if (!createElement) {
    URL.revokeObjectURL(url);
    return;
  }
  const a = createElement('a');
  a.href = url;
  a.download = `${spec.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
