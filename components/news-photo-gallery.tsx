"use client";

/* eslint-disable @next/next/no-img-element -- gallery images use short-lived signed URLs. */

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Lang } from "@/lib/site-content";

export function NewsPhotoGallery({ lang, title, images }: { lang: Lang; title: string; images: string[] }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowLeft") setActive((current) => current === null ? null : (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setActive((current) => current === null ? null : (current + 1) % images.length);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, images.length]);

  return <section className="article-gallery" aria-labelledby="article-gallery-title">
    <div className="article-gallery-heading">
      <div><p>{lang === "uz" ? "Fotogalereya" : "Photo gallery"}</p><h2 id="article-gallery-title">{lang === "uz" ? "Tadbirdan lavhalar" : "Scenes from the event"}</h2></div>
      <span>{images.length} {lang === "uz" ? "ta rasm" : images.length === 1 ? "image" : "images"}</span>
    </div>
    <div className="article-gallery-grid">
      {images.map((url, index) => <button type="button" onClick={() => setActive(index)} key={url} aria-label={lang === "uz" ? `${index + 1}-rasmni kattalashtirish` : `Enlarge image ${index + 1}`}>
        <img src={url} loading="lazy" alt={lang === "uz" ? `${title} — ${index + 1}-rasm` : `${title} — image ${index + 1}`} />
        <span><strong>{String(index + 1).padStart(2, "0")}</strong><Expand aria-hidden="true" /></span>
      </button>)}
    </div>
    {active !== null && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={lang === "uz" ? "Rasm ko‘rinishi" : "Image viewer"} onClick={() => setActive(null)}>
      <button className="gallery-lightbox-close" type="button" onClick={() => setActive(null)} aria-label={lang === "uz" ? "Yopish" : "Close"}><X /></button>
      {images.length > 1 && <button className="gallery-lightbox-previous" type="button" onClick={(event) => { event.stopPropagation(); setActive((active - 1 + images.length) % images.length); }} aria-label={lang === "uz" ? "Oldingi rasm" : "Previous image"}><ChevronLeft /></button>}
      <figure onClick={(event) => event.stopPropagation()}><img src={images[active]} alt={lang === "uz" ? `${title} — ${active + 1}-rasm` : `${title} — image ${active + 1}`} /><figcaption>{active + 1} / {images.length}</figcaption></figure>
      {images.length > 1 && <button className="gallery-lightbox-next" type="button" onClick={(event) => { event.stopPropagation(); setActive((active + 1) % images.length); }} aria-label={lang === "uz" ? "Keyingi rasm" : "Next image"}><ChevronRight /></button>}
    </div>}
  </section>;
}
