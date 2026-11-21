import { z } from 'zod'

/**
 * Typed frontmatter for an inspectable object. Every panel has the same four
 * parts (what it is, how it is made, what it does, slide references), plus
 * any facts that go beyond the lecture, each with a named source.
 */
export const AnchorSchema = z.object({
  /** mesher key, e.g. 'si:n+', 'poly', 'al:plug' */
  key: z.string(),
  /** layout point (λ) inside the object; omit to match any object of this key */
  x: z.number().optional(),
  y: z.number().optional(),
})

export const ContentSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(2),
  /** one line for the hover label */
  short: z.string().min(2).max(90),
  layer: z.enum(['wafer', 'die', 'cell', 'transistor', 'oxide', 'lattice', 'layout']),
  parent: z.string().nullable(),
  /** how this object is found in the generated mesh (cell-layer objects) */
  anchors: z.array(AnchorSchema).default([]),
  /** named scene object (non-generated layers) */
  node: z.string().optional(),
  slides: z.array(z.number().int().min(1).max(49)).min(1),
  /** recipe step id where it is made */
  fabStep: z.string().optional(),
  what: z.string().min(10),
  made: z.string().min(10),
  does: z.string().min(10),
  beyond: z.array(z.object({ text: z.string(), source: z.string().min(3) })).default([]),
  /** optional dive target */
  dive: z.object({ layer: z.enum(['die', 'cell', 'transistor', 'oxide', 'lattice']), device: z.enum(['nmos', 'pmos']).optional() }).optional(),
})

export type Content = z.infer<typeof ContentSchema>
export type ContentInput = z.input<typeof ContentSchema>

export const defineContent = (c: ContentInput): ContentInput => c
