import type { SupabaseClient } from '@supabase/supabase-js'
import type { Attempt, Collection, Item } from './db'

/**
 * The server side of sync: one Postgres table per collection (see
 * supabase/migrations). Row-level security limits every query to the
 * signed-in user's own rows; user_id is sent explicitly and checked by the
 * policies.
 */
export interface RemoteRow {
  key: string
  item: Item
  synced: string
}
export interface Remote {
  push(c: Collection, rows: { key: string; item: Item }[]): Promise<void>
  pull(c: Collection, since: string | null): Promise<RemoteRow[]>
  pushAttempts(list: Attempt[]): Promise<void>
}

interface Mapping {
  table: string
  key: string
  toRow(v: unknown, deleted: boolean): Record<string, unknown>
  fromRow(r: Record<string, unknown>): unknown
}

const iso = (ms: number) => new Date(ms).toISOString()
const ms = (s: unknown) => new Date(String(s)).getTime()

export const MAPPINGS: Record<Collection, Mapping> = {
  cards: {
    table: 'revise_cards',
    key: 'question_id',
    toRow: (v, d) => {
      const c = (v ?? {}) as { box?: number; due?: number; seen?: number; right?: number }
      return d ? { box: 1, due: iso(0), seen: 0, right_count: 0 } : { box: c.box, due: iso(c.due ?? 0), seen: c.seen ?? 0, right_count: c.right ?? 0 }
    },
    fromRow: (r) => ({ box: Number(r.box), due: ms(r.due), seen: Number(r.seen), right: Number(r.right_count) }),
  },
  lesson: {
    table: 'lesson_progress',
    key: 'position',
    toRow: (v, d) => {
      const l = (v ?? {}) as { done?: boolean; peeked?: boolean }
      return d ? { done: false, peeked: false } : { done: !!l.done, peeked: !!l.peeked }
    },
    fromRow: (r) => ({ done: !!r.done, peeked: !!r.peeked }),
  },
  mastery: {
    table: 'fact_mastery',
    key: 'fact_id',
    toRow: (v, d) => {
      const m = (v ?? {}) as { score?: number; mastered?: boolean }
      return d ? { score: 0, mastered: false } : { score: Math.max(0, Math.min(1, m.score ?? 0)), mastered: !!m.mastered }
    },
    fromRow: (r) => ({ score: Number(r.score), mastered: !!r.mastered }),
  },
  settings: {
    table: 'user_settings',
    key: 'key',
    toRow: (v, d) => ({ value: d ? null : (v ?? null) }),
    fromRow: (r) => r.value,
  },
}

const PAGE = 1000
/** re-read this far back on every pull: rows committed slightly out of order are not missed */
const OVERLAP_MS = 30_000

export function supabaseRemote(sb: SupabaseClient, userId: string): Remote {
  return {
    async push(c, rows) {
      if (!rows.length) return
      const m = MAPPINGS[c]
      const payload = rows.map(({ key, item }) => ({
        user_id: userId,
        [m.key]: key,
        ...m.toRow(item.v, !!item.d),
        deleted: !!item.d,
        updated_at: iso(item.t),
      }))
      for (let i = 0; i < payload.length; i += 500) {
        const { error } = await sb.from(m.table).upsert(payload.slice(i, i + 500), { onConflict: `user_id,${m.key}` })
        if (error) throw new Error(`push ${m.table}: ${error.message}`)
      }
    },
    async pull(c, since) {
      const m = MAPPINGS[c]
      const out: RemoteRow[] = []
      const from = since ? new Date(ms(since) - OVERLAP_MS).toISOString() : null
      for (let i = 0; ; i += PAGE) {
        let q = sb.from(m.table).select('*').eq('user_id', userId)
        if (from) q = q.gt('synced_at', from)
        const { data, error } = await q.order('synced_at').order(m.key).range(i, i + PAGE - 1)
        if (error) throw new Error(`pull ${m.table}: ${error.message}`)
        for (const r of data ?? []) {
          const row = r as Record<string, unknown>
          const item: Item = row.deleted ? { v: null, t: ms(row.updated_at), d: true } : { v: m.fromRow(row), t: ms(row.updated_at) }
          out.push({ key: String(row[m.key]), item, synced: String(row.synced_at) })
        }
        if ((data?.length ?? 0) < PAGE) break
      }
      return out
    },
    async pushAttempts(list) {
      if (!list.length) return
      const rows = list.map((a) => ({ id: a.id, user_id: userId, question_id: a.q, result: a.r, answered_at: iso(a.t) }))
      for (let i = 0; i < rows.length; i += 500) {
        // a retried push: rows already there are left as they are (append-only)
        const { error } = await sb.from('question_attempts').upsert(rows.slice(i, i + 500), { onConflict: 'id', ignoreDuplicates: true })
        if (error) throw new Error(`push attempts: ${error.message}`)
      }
    },
  }
}
