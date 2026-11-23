import { useState } from 'react'
import { useAtlas } from '../../state/store'
import { FACTS, SLIDES_OF } from '../bank'
import { factMastered, factSeen, slideCoverage } from '../progress'
import { TOPICS } from '../schema'
import { CHAPTERS } from '../../chapters/cmos/layers'
import { TOPIC_IDS, type TopicId } from '../../sources'

const AREA_TITLE: Record<string, string> = {
  intro: 'Introduction', materials: 'Silicon and dopants', junction: 'The p-n junction', devices: 'MOS transistors', logic: 'Logic gates',
  structure: 'Cross-section and masks', fabrication: 'Fabrication', layout: 'Layout and design rules', summary: 'Summary',
  crystal: 'Crystal structure', bands: 'Energy bands', growth: 'Crystal growth', defects: 'Defects', process: 'The process flow',
  cleanroom: 'The clean factory', cleaning: 'Wafer cleaning', gettering: 'Gettering', yield: 'Yield',
  deposition: 'Film deposition', cvd: 'Chemical vapour deposition', safety: 'Gas safety', plasma: 'Plasma processes', pvd: 'Evaporation and sputtering',
  epitaxy: 'Epitaxial growth', heteroepitaxy: 'Strain and lattice matching', siepi: 'Silicon epitaxy', mbe: 'Molecular beam epitaxy', soi: 'Silicon on insulator',
}

/**
 * The skill map (mastery per area, for each chapter) and every slide of one
 * deck with its share of facts mastered; click a slide to drill it.
 */
export function CoverageSheet({ onDrill, onClose }: { onDrill: (topic: TopicId, slide: number) => void; onClose: () => void }) {
  useAtlas((s) => s.progressVersion)
  const rvTopic = useAtlas((s) => s.revise.topic)
  const [topic, setTopic] = useState<TopicId>(rvTopic ?? 'topic2')
  const cov = slideCoverage(topic)
  const facts = FACTS.filter((f) => f.source.topic === topic)
  const mastered = facts.filter((f) => factMastered(f.id)).length
  const seen = facts.filter((f) => factSeen(f.id)).length
  const slides = SLIDES_OF(topic)
  return (
    <div className="sheet" role="dialog" aria-label="Coverage">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">revise · coverage</p>
          <h2>What you know, chapter by chapter</h2>
          <p className="sheet-sub mono">a fact counts as mastered once its questions reach box 3 or higher</p>
        </div>
        <button className="tool" onClick={onClose}>
          back to drill <kbd>Esc</kbd>
        </button>
      </header>
      <section className="cov-skills" aria-label="Skill map">
        <h3 className="eyebrow">skill map</h3>
        {CHAPTERS.map((c) => {
          const fs = FACTS.filter((f) => f.source.topic === c.topic)
          const areas = [...new Set(fs.map((f) => f.area))]
          return (
            <div key={c.id} className="cov-skill-row">
              <button className={'cov-ch' + (c.topic === topic ? ' on' : '')} onClick={() => setTopic(c.topic)}>
                <span className="mono">Ch.{c.n}</span> {c.title}
              </button>
              <div className="cov-skill-cells">
                {areas.map((a) => {
                  const af = fs.filter((f) => f.area === a)
                  const p = af.filter((f) => factMastered(f.id)).length / af.length
                  const s = af.some((f) => factSeen(f.id))
                  return (
                    <span key={a} className={'cov-skill ' + (p >= 0.99 ? 'full' : p > 0 ? 'part' : s ? 'seen' : 'none')} title={`${AREA_TITLE[a]}: ${Math.round(p * 100)} % of ${af.length} facts`}>
                      <i style={{ width: `${p * 100}%` }} />
                      <b>{AREA_TITLE[a]}</b>
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
      <nav className="rv-topics cov-decks" role="group" aria-label="Deck">
        {TOPIC_IDS.map((t) => (
          <button key={t} className="chip" aria-pressed={t === topic} onClick={() => setTopic(t)}>
            Topic {t.slice(5)}
          </button>
        ))}
        <span className="sheet-sub mono">
          {mastered} of {facts.length} facts mastered · {seen} attempted
        </span>
      </nav>
      <div className="cov-body">
        {TOPICS.map((t) => {
          const ss = slides.filter((s) => s.area === t)
          if (!ss.length) return null
          return (
            <section key={t} className="cov-topic">
              <h3 className="eyebrow">{AREA_TITLE[t]}</h3>
              <div className="cov-grid">
                {ss.map((s) => {
                  const c = cov.find((x) => x.slide === s.slide)!
                  const tone = c.pct >= 0.99 ? 'full' : c.pct > 0 ? 'part' : c.seen ? 'seen' : 'none'
                  return (
                    <button key={s.slide} className={'cov-tile ' + tone} disabled={!c.facts} onClick={() => onDrill(topic, s.slide)} aria-label={`Slide ${s.slide}, ${s.title}: ${Math.round(c.pct * 100)} % of ${c.facts} facts mastered. Drill it.`}>
                      <span className="cov-n mono">{String(s.slide).padStart(2, '0')}</span>
                      <span className="cov-t">{s.title}</span>
                      <span className="cov-bar">
                        <i style={{ width: `${c.pct * 100}%` }} />
                      </span>
                      <span className="cov-p mono">{c.facts ? `${Math.round(c.pct * 100)} % · ${c.mastered}/${c.facts}` : 'photo only'}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
