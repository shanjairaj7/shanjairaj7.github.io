import React from 'react';
import { Check, LockKeyhole, Sparkles } from 'lucide-react';
import './pricing.css';

const workshopItems = [
  'Live Claude & AI workshop — Sunday, 9 August, 3:00 PM–6:00 PM IST',
  'Practical AI workflows for reports, Excel, presentations and research',
  'Build your first AI worker for repeat work',
  'Made for More workshop certificate',
];

export default function PricingPage() {
  return <main className="pricing-page">
    <header className="pricing-nav"><a href="/">Made <span>for More</span></a><a href="/#/register">Reserve your seat</a></header>
    <section className="pricing-hero"><p><Sparkles size={15}/> LIVE THIS SUNDAY · 9 AUGUST 2026</p><h1>Simple pricing.<br/><em>One live workshop.</em></h1><span>Join live online in simple English. No subscription. No hidden recurring charge.</span></section>
    <section className="pricing-grid">
      <article className="pricing-card featured"><div className="pricing-label">LIVE WORKSHOP</div><h2>Made for More: Claude & AI Workshop</h2><p className="pricing-subtitle">For working professionals who want to work faster and get ahead with AI.</p><div className="pricing-cost"><s>₹1,500</s><strong>₹150</strong><span>one-time payment</span></div><a className="pricing-cta" href="/#/register">Reserve my live seat · ₹150</a><div className="pricing-items">{workshopItems.map((item) => <p key={item}><Check/> {item}</p>)}</div></article>
      <article className="pricing-card addon"><div className="pricing-label">OPTIONAL LIVE ADD-ON</div><h2>Build With AI</h2><p className="pricing-subtitle">Learn prompt engineering and how to turn an idea into a simple app people can use online.</p><div className="pricing-cost"><s>₹2,100</s><strong>₹342</strong><span>optional one-time add-on</span></div><p className="pricing-note">You can add this at checkout. It is not required to join the main workshop.</p><div className="pricing-items"><p><Check/> Build a simple app without coding</p><p><Check/> Learn how customers can pay online</p><p><Check/> Use Claude, Gemini, Perplexity and Codex</p></div></article>
    </section>
    <section className="pricing-trust"><LockKeyhole/><div><b>Secure one-time checkout</b><span>Payment is processed by Paddle. Workshop details are sent after successful payment.</span></div></section>
    <footer className="pricing-footer"><span>Questions? <a href="mailto:shanjairajdev@gmail.com">shanjairajdev@gmail.com</a></span><span><a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/refunds.html">Refund policy</a></span></footer>
  </main>;
}
