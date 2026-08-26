import Link from "next/link";

export default function NotFound() {
  return <main className="not-found-shell"><section className="gateway-card"><div className="brand-mark">M</div><p className="eyebrow">404 • Sahifa topilmadi</p><h1>Bu sahifa mavjud emas</h1><p className="gateway-copy">The page may have moved, or the information has not been published yet.</p><div className="gateway-actions"><Link className="button button-primary" href="/uz">O‘zbekcha bosh sahifa</Link><Link className="button button-secondary" href="/en">English homepage</Link></div></section></main>;
}
