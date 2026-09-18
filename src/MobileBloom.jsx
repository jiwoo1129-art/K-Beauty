export default function MobileBloom({ compact = false }) {
  return (
    <div className={`mobile-bloom${compact ? ' mobile-bloom--compact' : ''}`} aria-hidden="true">
      <span className="mobile-bloom__halo" />
      <span className="mobile-bloom__orbit" />
      <span className="mobile-bloom__bottle">
        <i className="mobile-bloom__dropper" />
        <i className="mobile-bloom__band" />
        <i className="mobile-bloom__glass" />
        <i className="mobile-bloom__label">COMPLY.AI<small>BEAUTY SERUM</small></i>
      </span>
      <span className="mobile-bloom__token mobile-bloom__token--one" />
      <span className="mobile-bloom__token mobile-bloom__token--two" />
    </div>
  );
}
