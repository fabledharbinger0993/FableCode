export interface ScribeCourseLane {
  id: string;
  name: string;
  purpose: string;
  sourceSurface: string;
}

export const SCRIBE_COURSE_LANES: ScribeCourseLane[] = [
  {
    id: 'guided-foundations',
    name: 'Guided Foundations',
    purpose: 'Slow, scaffolded lessons with examples, hints, and visible feedback.',
    sourceSurface: 'LearnPanel guided lesson flow'
  },
  {
    id: 'fast-practice',
    name: 'Fast Practice',
    purpose: 'Short challenge loops for learners who already understand the concept.',
    sourceSurface: 'Ring pacing and fast lesson path'
  },
  {
    id: 'translation-lab',
    name: 'Translation Lab',
    purpose: 'Move between code, blocks, visual state, and explanation until the concept sticks.',
    sourceSurface: 'Lesson equivalence and preview contract metadata'
  }
];
