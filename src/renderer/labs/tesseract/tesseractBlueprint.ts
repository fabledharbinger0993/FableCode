export type TesseractViewMode = 'blueprint' | 'isometric' | 'character' | 'walkthrough';

export interface TesseractPrimitive {
  id: string;
  name: string;
  category: 'floor-plan' | 'character' | 'prop' | 'export';
  purpose: string;
}

export const TESSERACT_VIEW_MODES: TesseractViewMode[] = ['blueprint', 'isometric', 'character', 'walkthrough'];

export const TESSERACT_PRIMITIVES: TesseractPrimitive[] = [
  {
    id: 'room',
    name: 'Room',
    category: 'floor-plan',
    purpose: 'Drag a rectangular room, snap it to the grid, and edit dimensions directly.'
  },
  {
    id: 'wall',
    name: 'Wall',
    category: 'floor-plan',
    purpose: 'Draw or resize wall segments with snap points for doors and windows.'
  },
  {
    id: 'door-window',
    name: 'Door / Window',
    category: 'floor-plan',
    purpose: 'Place openings on wall segments with simple orientation controls.'
  },
  {
    id: 'character-placeholder',
    name: 'Character Placeholder',
    category: 'character',
    purpose: 'Block out scale, pose, and placement before detailed character modeling.'
  },
  {
    id: 'blueprint-export',
    name: 'Blueprint Export',
    category: 'export',
    purpose: 'Export a scene as JSON plus SVG/PNG blueprint snapshots.'
  }
];
