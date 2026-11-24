import { slides, defaultDeps } from '../server/handlers'

// Vercel function: see server/handlers.ts
const handle = (req: Request) => slides(req, defaultDeps())
export const GET = handle
export const POST = handle
export const DELETE = handle
export const OPTIONS = handle
