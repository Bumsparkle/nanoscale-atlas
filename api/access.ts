import { access, defaultDeps } from '../server/handlers.js'

// Vercel function: see server/handlers.ts
const handle = (req: Request) => access(req, defaultDeps())
export const GET = handle
export const POST = handle
export const DELETE = handle
export const OPTIONS = handle
