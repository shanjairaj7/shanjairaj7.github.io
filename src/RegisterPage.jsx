import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, LockKeyhole, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import './register.css';
import './urgency.css';
import { flush, saveLeadDraft, track } from './analytics';

const registrationClosesAt = new Date('2026-08-09T14:00:00+05:30').getTime();
const workshopPrice = 150;

const countries = [
  { name: 'India', flag: '🇮🇳', code: '+91' }, { name: 'Sri Lanka', flag: '🇱🇰', code: '+94' },
  { name: 'United Arab Emirates', flag: '🇦🇪', code: '+971' }, { name: 'United States', flag: '🇺🇸', code: '+1' },
  { name: 'United Kingdom', flag: '🇬🇧', code: '+44' }, { name: 'Singapore', flag: '🇸🇬', code: '+65' },
  { name: 'Canada', flag: '🇨🇦', code: '+1' }, { name: 'Australia', flag: '🇦🇺', code: '+61' },
];

const professions = ['IT / Software', 'Sales', 'Marketing', 'Finance / Accounting', 'HR / Recruitment', 'Operations', 'Manager / Team Lead', 'Consultant', 'Business Owner', 'Creator / Freelancer', 'Teacher / Trainer', 'Healthcare', 'Legal', 'Government', 'Student', 'Other'];

function Countdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  const remaining = Math.max(0, registrationClosesAt - now);
  const active = remaining > 0;
  const parts = [Math.floor(remaining / 3_600_000), Math.floor((remaining % 3_600_000) / 60_000), Math.floor((remaining % 60_000) / 1_000)].map(n => String(n).padStart(2, '0'));
  return <div className="rp-countdown"><span>{active ? 'REGISTRATION CLOSES IN' : 'REGISTRATION IS CLOSED'}</span><strong>{active ? parts.join(':') : 'CLOSED'}</strong><small>{active ? 'Seats close one hour before the live workshop starts.' : 'Please contact us for the next live workshop.'}</small></div>;
}

function PhoneCountryPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const options = useMemo(() => countries.filter(country => `${country.name} ${country.code}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <div className="rp-country-picker"><button type="button" aria-label="Choose country code" onClick={() => setOpen(!open)}>{value.flag}<span>{value.code}</span><ChevronDown size={15}/></button>{open && <div className="rp-country-menu"><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search country"/>{options.map(country => <button type="button" key={country.name} onClick={() => { onChange(country); setOpen(false); setQuery(''); }}>{country.flag} {country.name} <small>{country.code}</small></button>)}</div>}</div>;
}

export default function RegisterPage() {
  const [country, setCountry] = useState(countries[0]);
  const [draftConsent, setDraftConsent] = useState(false);
  const formCardRef = useRef(null);
  const formRef = useRef(null);
  const draftTimerRef = useRef(null);
  const completedFieldsRef = useRef(new Set());
  const registrationStartedRef = useRef(false);
  const price = workshopPrice;
  const draft = (consent = draftConsent, countryValue = country) => {
    const data = new FormData(formRef.current);
    return {
      consent,
      firstName: data.get('firstName'), lastName: data.get('lastName'), email: data.get('email'),
      phone: `${countryValue.code} ${data.get('phone') || ''}`.trim(), profession: data.get('profession'),
    };
  };
  const queueDraft = (consent = draftConsent, countryValue = country) => {
    if (!consent) return;
    const nextDraft = draft(consent, countryValue);
    window.localStorage.setItem('madeForMoreRegistrationDraftUI', JSON.stringify({
      ...nextDraft,
      countryCode: countryValue.code,
    }));
    window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => saveLeadDraft(nextDraft), 700);
  };
  const submit = event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const registration = {
      firstName: data.get('firstName'), lastName: data.get('lastName'), email: data.get('email'),
      phone: `${country.code} ${data.get('phone')}`, profession: data.get('profession'),
      analyticsConsent: draftConsent,
    };
    saveLeadDraft({ ...registration, consent: draftConsent, registrationSubmitted: true });
    track('registration_submitted', { price });
    flush();
    window.sessionStorage.setItem('madeForMoreRegistration', JSON.stringify(registration));
    window.location.href = '/#/checkout';
  };
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => formCardRef.current?.scrollIntoView({ block: 'start' }));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('madeForMoreRegistrationDraftUI') || 'null');
      if (!saved?.consent || !formRef.current) return;
      const form = formRef.current.elements;
      form.firstName.value = saved.firstName || '';
      form.lastName.value = saved.lastName || '';
      form.phone.value = (saved.phone || '').replace(saved.countryCode || '', '').trim();
      form.email.value = saved.email || '';
      form.profession.value = saved.profession || '';
      form.consent.checked = true;
      const savedCountry = countries.find((item) => item.code === saved.countryCode);
      if (savedCountry) setCountry(savedCountry);
      setDraftConsent(true);
    } catch { /* A malformed local draft should never block registration. */ }
  }, []);
  useEffect(() => () => window.clearTimeout(draftTimerRef.current), []);
  return <main className="register-page">
    <header className="rp-top"><a href="/" aria-label="Back to Made for More"><ArrowLeft size={18}/> Back to workshop</a><a className="rp-brand" href="/">Made <span>for More</span></a></header>
    <section data-track-section="registration-intro" className="rp-hero"><p>LIVE THIS SUNDAY · 9 AUGUST 2026</p><h1>You are one step away from becoming the <em>AI person</em> in your team.</h1><span>3:00 PM–6:00 PM IST · Live online · Simple English</span></section>
    <div className="rp-layout">
      <section data-track-section="registration-form" className="rp-form-card" id="registration-form" ref={formCardRef}><div className="rp-card-title"><p>MADE FOR MORE LIVE CLAUDE & AI WORKSHOP</p><h2>Reserve your live seat</h2><span>Fill this in. Secure payment is the next step.</span></div><Countdown/>
        <form ref={formRef} onSubmit={submit} onFocus={() => { if (!registrationStartedRef.current) { registrationStartedRef.current = true; track('registration_started'); } }} onChange={() => queueDraft()} onBlur={(event) => { const field = event.target.name; if (field && field !== 'consent' && !completedFieldsRef.current.has(field) && event.target.value) { completedFieldsRef.current.add(field); track('form_field_completed', { field }); } }}><div className="rp-two"><label>First name<input name="firstName" autoComplete="given-name" required placeholder="Your first name"/></label><label>Last name<input name="lastName" autoComplete="family-name" required placeholder="Your last name"/></label></div><label>WhatsApp number<div className="rp-phone"><PhoneCountryPicker value={country} onChange={(value) => { setCountry(value); queueDraft(draftConsent, value); }}/><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="Your mobile number"/></div></label><label>Email address<input name="email" type="email" inputMode="email" autoComplete="email" required placeholder="you@example.com"/></label><label>Your profession<select name="profession" required defaultValue=""><option value="" disabled>Select your profession</option>{professions.map(profession => <option key={profession}>{profession}</option>)}</select></label><label className="rp-consent"><input name="consent" type="checkbox" required onChange={(event) => { const consent = event.target.checked; setDraftConsent(consent); if (consent) { track('registration_details_saved'); queueDraft(consent); } }}/><span>I agree that Made for More may securely save these details to finish my registration and send workshop information on WhatsApp and email.</span></label><button className="rp-pay" type="submit">Continue to see your live-workshop offer · ₹{price}</button></form>
        <div className="rp-security"><article><LockKeyhole/><div><b>HTTPS encrypted</b><span>This page uses a secure connection.</span></div></article><article><ShieldCheck/><div><b>Your details stay private</b><span>Use them only for workshop registration.</span></div></article><article><Smartphone/><div><b>No card details here</b><span>Payment is completed with your payment provider.</span></div></article></div>
        <p className="rp-legal-links"><a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/refunds.html">Refund policy</a></p>
      </section>
      <aside className="rp-summary"><p>YOUR LIVE WORKSHOP INVITATION</p><h2>Sunday, 9 August</h2><div className="rp-invite"><span><b>WHEN</b>3:00 PM–6:00 PM IST</span><span><b>WHERE</b>Live online workshop</span><span><b>WITH</b>Shanjai Raj</span><span><b>YOU WILL GET</b>Live workshop + 2 practical AI sessions + certificate</span></div><div className="rp-value"><p>WHAT YOU WILL LEARN LIVE</p><span><Check/> Prompt AI to get the result you want</span><span><Check/> Use Claude, Gemini, Perplexity and Codex for real work</span><span><Check/> Turn one useful idea into a simple app</span><span><Check/> See how an app can take payments and be shared online</span><span><Check/> Made for More workshop certificate</span></div><div className="rp-price" style={{ padding: 16 }}><span>One-time live workshop access</span><b style={{ marginTop: 8, fontSize: 17 }}>Pay today: ₹{price}</b></div><p className="rp-fineprint"><Mail size={14}/> Workshop joining details will be sent after successful payment.</p></aside>
    </div>
  </main>;
}
