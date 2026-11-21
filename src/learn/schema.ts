import { z } from 'zod'
import { SourceRefSchema, TOPIC_IDS } from '../sources'

/**
 * Learning content schemas: the fact inventory (content/topic2/facts.json),
 * the question bank (content/topic2/questions/*.ts) and the lesson
 * (content/topic2/lesson.ts). Everything a question needs to drive or read
 * the scene is plain data, so the build tests can check it against the real
 * store and layout without rendering anything.
 */

export const FACT_KINDS = ['definition', 'process-step', 'number', 'cause-effect', 'diagram', 'rule'] as const
export const TOPICS = [
  'intro', 'materials', 'junction', 'devices', 'logic', 'structure', 'fabrication', 'layout',
  // Topic 3
  'crystal', 'bands', 'growth', 'defects', 'process',
  // Topic 4
  'cleanroom', 'cleaning', 'gettering', 'yield',
  'summary',
] as const
export type Topic = (typeof TOPICS)[number]

export const FactSchema = z.object({
  /** s07-… for Topic 2; t3-s07-… and t4-s07-… for the later decks */
  id: z.string().regex(/^(t[34]-)?s\d\d-[a-z0-9-]+$/),
  source: SourceRefSchema,
  statement: z.string().min(8),
  kind: z.enum(FACT_KINDS),
  /** subject area, for Revise filters and the coverage screen */
  area: z.enum(TOPICS),
  /** numbers, truth tables, fab steps and rules: need two question types */
  key: z.boolean(),
  /** content ids of the model objects this fact is about (mastery overlay) */
  objects: z.array(z.string()).default([]),
  /** the slide is wrong here: what it says (the statement teaches the correct fact) */
  corrects: z.string().optional(),
})
export type Fact = z.infer<typeof FactSchema>

export const FactFileSchema = z.object({
  source: z.string(),
  topic: z.enum(TOPIC_IDS),
  slides: z.array(z.object({ slide: z.number().int(), title: z.string(), area: z.enum(TOPICS) })),
  unreadable: z.array(z.object({ slide: z.number().int(), what: z.string() })),
  /** slides whose content an earlier deck already covers: the facts are linked, not duplicated */
  links: z.array(z.object({ slide: z.number().int(), facts: z.array(z.string()).min(1), note: z.string() })).default([]),
  /** slides with nothing examinable (photographs) */
  noFacts: z.array(z.object({ slide: z.number().int(), why: z.string() })).default([]),
  facts: z.array(FactSchema),
})

const LAYER = z.enum(['wafer', 'die', 'cell', 'transistor', 'oxide', 'lattice'])
const VIEW = z.enum(['explore', 'section', 'masks', 'fab', 'logic', 'layout'])
const CUT = z.enum(['slide27', 'ngate', 'pgate'])
const MASK = z.enum(['nwell', 'poly', 'nplus', 'pplus', 'contact', 'metal'])
const BIT = z.union([z.literal(0), z.literal(1)])
const TAB = z.enum(['inverter', 'switch', 'nand', 'nor', 'junction'])
const SIDE = z.enum(['x0', 'x1', 'y0', 'y1'])

/** A scene state to put the app in: lesson steps, question setup, predict reveals, "show me". */
export const SceneSchema = z.object({
  layer: LAYER.optional(),
  device: z.enum(['nmos', 'pmos']).optional(),
  view: VIEW.optional(),
  /** fab step by recipe id */
  step: z.string().optional(),
  /** lock the section plane (null unlocks) */
  section: CUT.nullable().optional(),
  inputs: z.object({ a: BIT, b: BIT }).optional(),
  vg: z.number().min(0).max(1).optional(),
  lattice: z.object({ structure: z.enum(['crystal', 'poly', 'amorphous']), dopant: z.enum(['none', 'P', 'B']) }).optional(),
  bench: z.object({ tab: TAB.optional(), g: BIT.optional(), v: z.number().optional(), ratio: z.number().optional() }).optional(),
  layers: z.array(MASK).optional(),
  /** reset the layout to slides 27–28 before anything else */
  resetLayout: z.boolean().optional(),
  editMode: z.boolean().optional(),
  /** layout edge moves (λ), applied in order */
  edits: z.array(z.object({ mask: MASK, index: z.number().int(), side: SIDE, value: z.number() })).optional(),
  /** glide the camera to this object (no panel) */
  look: z.string().optional(),
})
export type Scene = z.infer<typeof SceneSchema>

/** What a "do" question asks you to reach; checked against the store and the layout. */
export const TargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('gate'), gate: z.enum(['INV', 'NAND', 'NOR']), a: BIT.optional(), b: BIT.optional(), y: BIT.optional() }),
  z.object({ kind: z.literal('switch'), g: BIT }),
  z.object({ kind: z.literal('section'), cut: CUT }),
  z.object({ kind: z.literal('fab'), steps: z.array(z.string()).min(1) }),
  z.object({ kind: z.literal('layoutViolation'), rule: z.string() }),
  z.object({ kind: z.literal('layoutClean'), nmosL: z.number().optional(), pmosL: z.number().optional(), nmosW: z.number().optional(), pmosW: z.number().optional() }),
  z.object({ kind: z.literal('layers'), layers: z.array(MASK) }),
  z.object({ kind: z.literal('vg'), device: z.enum(['nmos', 'pmos']), on: z.boolean() }),
  z.object({ kind: z.literal('lattice'), structure: z.enum(['crystal', 'poly', 'amorphous']).optional(), dopant: z.enum(['none', 'P', 'B']).optional() }),
  z.object({ kind: z.literal('junction'), regime: z.enum(['forward', 'reverse', 'zero']), minWidth: z.number().optional(), maxWidth: z.number().optional(), wpOverWn: z.enum(['>1', '<1']).optional() }),
  z.object({ kind: z.literal('layer'), layer: LAYER, device: z.enum(['nmos', 'pmos']).optional() }),
])
export type Target = z.infer<typeof TargetSchema>

export const HintSchema = z.object({ text: z.string().min(3), highlight: z.string().optional() })

const base = {
  id: z.string().regex(/^q-[a-z0-9-]+$/),
  prompt: z.string().min(8),
  factIds: z.array(z.string()).min(1),
  /** the model object the question is about (mastery, "open step") */
  objectRef: z.string().nullable().default(null),
  /** the slide it draws on (opened by the Source button) */
  source: SourceRefSchema,
  hints: z.array(HintSchema).min(1),
  workedSolution: z.string().min(10),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  /** put the app in this state when the question opens */
  scene: SceneSchema.optional(),
}

export const QuestionSchema = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('do'), answer: z.object({ target: TargetSchema, solve: SceneSchema }) }),
  z.object({
    ...base,
    type: z.literal('predict'),
    answer: z.object({ options: z.array(z.string()).min(2), correct: z.number().int().min(0), reveal: SceneSchema, result: z.string() }),
  }),
  z.object({
    ...base,
    type: z.literal('calc'),
    answer: z.object({ value: z.number(), tol: z.number().positive(), unit: z.string() }),
  }),
  z.object({ ...base, type: z.literal('label'), answer: z.object({ objects: z.array(z.string()).min(1) }), scene: SceneSchema }),
  z.object({
    ...base,
    type: z.literal('recall'),
    answer: z.union([
      z.object({ options: z.array(z.string()).min(2), correct: z.number().int().min(0) }),
      z.object({ accept: z.array(z.string()).min(1) }),
    ]),
  }),
])
export type Question = z.infer<typeof QuestionSchema>
export type QuestionInput = z.input<typeof QuestionSchema>
export type QType = Question['type']

/** One teaching step: explain why, show it on the model, then check. */
export const LessonStepSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  /** the explanation: why, not just what */
  text: z.string().min(120),
  /** a worked example or a demonstration to try on the model */
  example: z.object({ kind: z.enum(['worked', 'demo']), text: z.string().min(40) }).optional(),
  scene: SceneSchema,
  sources: z.array(SourceRefSchema).min(1),
  factIds: z.array(z.string()).min(1),
  /** one check, or two when the step includes a calculation */
  checks: z.array(z.string()).min(1).max(2),
})
export type LessonStep = z.infer<typeof LessonStepSchema>

export const LessonSectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  /** what you will be able to do by the end */
  intro: z.string().min(40),
  steps: z.array(LessonStepSchema).min(3).max(6),
  /** 3–4 questions mixing this section with earlier ones */
  review: z.array(z.string()).min(3).max(4),
})
export type LessonSection = z.infer<typeof LessonSectionSchema>

export const q = (x: QuestionInput) => x
