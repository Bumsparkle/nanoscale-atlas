/** the two brushed-steel bay doors and their seam (the home page and the access gate) */
export function DoorLeaves() {
  return (
    <>
      <div className="door door-l" aria-hidden>
        <div className="door-window" />
        <div className="door-plate">
          <span>LITHO BAY 2</span>
          <span>ISO 5</span>
        </div>
      </div>
      <div className="door door-r" aria-hidden>
        <div className="door-window" />
        <div className="door-plate">
          <span>YELLOW LIGHT ONLY</span>
          <span>λ &gt; 500 nm</span>
        </div>
      </div>
      <div className="door-seam" aria-hidden />
    </>
  )
}
