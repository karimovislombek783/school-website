"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { copy, Lang } from "@/lib/site-content";

export function NewsletterForm({ lang }: { lang: Lang }) {
  const [done, setDone] = useState(false);
  const t = copy[lang];
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setDone(true); }
  return (
    <form className="newsletter-form" onSubmit={submit}>
      <label><span className="sr-only">{t.forms.email}</span><input required type="email" placeholder={t.forms.email} /></label>
      <select aria-label={t.forms.language} defaultValue={lang}><option value="uz">O‘zbekcha</option><option value="en">English</option></select>
      <button className="button button-gold" type="submit">{done ? <CheckCircle2 size={18} /> : <Send size={18} />}{done ? t.forms.success : t.forms.subscribe}</button>
      <label className="consent"><input required type="checkbox" /> <span>{t.forms.consent}</span></label>
      <small>{t.forms.previewNotice}</small>
    </form>
  );
}

export function ContactForm({ lang }: { lang: Lang }) {
  const [done, setDone] = useState(false);
  const t = copy[lang];
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setDone(true); }
  return (
    <form className="contact-form" onSubmit={submit}>
      <label>{t.forms.name}<input required /></label>
      <label>{t.forms.email}<input required type="email" /></label>
      <label className="full-field">{t.forms.message}<textarea required rows={6} /></label>
      <div className="full-field form-row"><button className="button button-primary" type="submit">{done ? <CheckCircle2 size={18} /> : <Send size={18} />}{done ? t.forms.success : t.forms.send}</button><small>{t.forms.previewNotice}</small></div>
    </form>
  );
}
