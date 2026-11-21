import { useAtlas } from '../../state/store'
import { FACTS, SLIDES } from '../bank'
import { slideCoverage } from '../progress'
import { TOPICS } from '../schema'

const TOPIC_NAME: Record<string, string> = {
  intro: 'Introduction', materials: 'Silicon and dopants', junction: 'The p-n junction', devices: 'MOS transistors', logic: 'Logic gates',
  structure: 'Cross-section and masks', fabrication: 'Fabrication', layout: 'Layout and design rules', summary: 'Summary',
}

/** every slide with its share of facts mastered; click one to drill just its questions */
export function CoverageSheet({ onDrill, onClose }: { onDrill: (slide: number) => void; onClose: () => void }) {
  useAtlas((s) => s.progressVersion)
  const cov = slideCoverage()
  const mastered = cov.reduce((s, c) => s + c.mastered, 0)
  const seen = cov.reduce((s, c) => s + c.seen, 0)
  return (
    <div className="sheet" role="dialog" aria-label="Coverage">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">revise · coverage</p>
          <h2>What you know, slide by slide</h2>
          <p className="sheet-sub mono">
            {mastered} of {FACTS.length} facts mastered · {seen} attempted · a fact counts as mastered once its questions reach box 3 or higher
          </p>
        </div>
        <button className="tool" onClick={onClose}>
          back to drill <kbd>Esc</kbd>
        </button>
      </header>
      <div className="cov-body">
        {TOPICS.map((t) => {
          const slides = SLIDES.filter((s) => s.topic === t)
          if (!slides.length) return null
          return (
            <section key={t} className="cov-topic">
              <h3 className="eyebrow">{TOPIC_NAME[t]}</h3>
              <div className="cov-grid">
                {slides.map((s) => {
                  const c = cov[s.slide - 1]
                  const tone = c.pct >= 0.99 ? 'full' : c.pct > 0 ? 'part' : c.seen ? 'seen' : 'none'
                  return (
                    <button key={s.slide} className={'cov-tile ' + tone} onClick={() => onDrill(s.slide)} aria-label={`Slide ${s.slide}, ${s.title}: ${Math.round(c.pct * 100)} % of ${c.facts} facts mastered. Drill it.`}>
                      <span className="cov-n mono">{String(s.slide).padStart(2, '0')}</span>
                      <span className="cov-t">{s.title}</span>
                      <span className="cov-bar">
                        <i style={{ width: `${c.pct * 100}%` }} />
                      </span>
                      <span className="cov-p mono">
                        {Math.round(c.pct * 100)} % · {c.mastered}/{c.facts}
                      </span>
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
