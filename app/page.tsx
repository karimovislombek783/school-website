import Link from "next/link";

export default function LanguageGateway() {
  return (
    <main className="gateway-shell">
      <section className="gateway-card" aria-labelledby="gateway-title">
        <div className="brand-mark" aria-hidden="true">M</div>
        <p className="eyebrow">School Website Project</p>
        <h1 id="gateway-title">Choose your language</h1>
        <p className="gateway-copy">
          This development preview uses placeholder institutional information
          until the school approves its official content.
        </p>
        <div className="gateway-actions">
          <Link className="button button-primary" href="/uz">O‘zbekcha</Link>
          <Link className="button button-secondary" href="/en">English</Link>
        </div>
      </section>
    </main>
  );
}
