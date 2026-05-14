import type { DomainType, Lesson, LessonHelp, LessonHelpScenario, PhaseType } from './types';

const HELP_FOLLOW_UP = 'If you still want a deeper answer, try a Google search or ask an AI.';

function withFollowUp(answer: string): string {
  return `${answer} ${HELP_FOLLOW_UP}`;
}

function makeScenario(topic: string, question: string, answer: string): LessonHelpScenario {
  return {
    topic,
    question,
    answer: withFollowUp(answer)
  };
}

function objectiveForLesson(lesson: Lesson): string {
  if (lesson.phaseType === 'intro') {
    return 'Name the big idea in plain English.';
  }
  if (lesson.phaseType === 'interference') {
    return 'Find the first mismatch and repair it.';
  }
  if (lesson.phaseType === 'synthesis') {
    return 'Connect several steps into one working flow.';
  }
  if (lesson.phaseType === 'finale') {
    return 'Run the full lesson flow from start to finish.';
  }
  if (lesson.domainType === 'logic') {
    return 'Change a value on purpose and predict the result.';
  }
  if (lesson.domainType === 'visual') {
    return 'Match each visual block or control to what it changes.';
  }
  if (lesson.domainType === 'translation') {
    return 'Prove code and blocks mean the same thing.';
  }

  return 'Understand the main lesson behavior and verify the result.';
}

function commonMistakeForLesson(phase?: PhaseType, domain?: DomainType): string {
  if (phase === 'intro') {
    return 'Trying to memorize the wording instead of naming the core idea.';
  }
  if (phase === 'interference') {
    return 'Changing many things at once and losing the real cause of the bug.';
  }
  if (phase === 'synthesis' || phase === 'finale') {
    return 'Checking only the last step instead of tracing the full handoff chain.';
  }
  if (domain === 'logic') {
    return 'Changing a value without first predicting what should happen next.';
  }
  if (domain === 'visual') {
    return 'Watching the preview without checking which control or block drove the change.';
  }
  if (domain === 'translation') {
    return 'Matching names while missing that the behavior is different.';
  }

  return 'Moving too fast before checking the last change.';
}

function trickyPointForLesson(phase?: PhaseType, domain?: DomainType): string {
  if (phase === 'intro') {
    return 'The tricky part is separating the main idea from the example shown on screen.';
  }
  if (phase === 'interference') {
    return 'The tricky part is finding the first wrong step instead of the loudest symptom.';
  }
  if (phase === 'synthesis') {
    return 'The tricky part is keeping each handoff correct while several steps are connected.';
  }
  if (phase === 'finale') {
    return 'The tricky part is proving the whole flow works, not just one piece.';
  }
  if (domain === 'logic') {
    return 'The tricky part is tracking which value changed and what depends on it.';
  }
  if (domain === 'visual') {
    return 'The tricky part is matching the visible result to the exact block or control that caused it.';
  }
  if (domain === 'translation') {
    return 'The tricky part is showing that different representations still produce the same behavior.';
  }

  return 'The tricky part is staying focused on one observable change at a time.';
}

function scenariosForLesson(lesson: Lesson): LessonHelpScenario[] {
  const { title } = lesson;
  const objective = objectiveForLesson(lesson);
  const commonMistake = commonMistakeForLesson(lesson.phaseType, lesson.domainType);
  const trickyPoint = trickyPointForLesson(lesson.phaseType, lesson.domainType);

  return [
    makeScenario(
      'Big Idea',
      `What is this lesson really about in "${title}"?`,
      `Focus on one clear lesson objective: ${objective}`
    ),
    makeScenario(
      'Start Here',
      'What should I try first?',
      'Start with one small change, watch the preview or output, then say out loud what changed.'
    ),
    makeScenario(
      'Watch For',
      'What result should I be looking for?',
      'Look for one predictable result that clearly matches the change you just made. If two things changed, slow down and isolate one input.'
    ),
    makeScenario(
      'Trouble Spot',
      'What part of this lesson usually trips people up?',
      trickyPoint
    ),
    makeScenario(
      'Common Mistake',
      'What is the most common mistake here?',
      commonMistake
    ),
    makeScenario(
      'Check Your Work',
      'How do I know I actually got it right?',
      'You got it right when you can predict the outcome before you make the change, then the result matches that prediction.'
    )
  ];
}

function buildLessonHelp(lesson: Lesson): LessonHelp {
  return {
    objective: objectiveForLesson(lesson),
    scenarios: scenariosForLesson(lesson)
  };
}

export function withLessonHelp<T extends Lesson>(lessons: T[]): T[] {
  return lessons.map((lesson) => ({
    ...lesson,
    help: buildLessonHelp(lesson)
  }));
}

export interface LessonHelpIndexEntry {
  lessonId: string;
  lessonTitle: string;
  objective: string;
  scenarios: LessonHelpScenario[];
}

export function buildLessonHelpIndex(lessons: Lesson[]): LessonHelpIndexEntry[] {
  return lessons.map((lesson) => ({
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    objective: lesson.help?.objective ?? objectiveForLesson(lesson),
    scenarios: lesson.help?.scenarios ?? scenariosForLesson(lesson)
  }));
}