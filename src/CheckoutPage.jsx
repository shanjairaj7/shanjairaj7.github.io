import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, LockKeyhole, Mail, Plus, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import './register.css';
import './checkout.css';

const earlyBirdEndsAt = new Date('2026-08-04T23:59:59+05:30').getTime();
const basePaymentUrl = import.meta.env.VITE_PAYMENT_URL_BASE || import.meta.env.VITE_PAYMENT_URL || '';
const upgradePaymentUrl = import.meta.env.VITE_PAYMENT_URL_WITH_UPSELL || '';
const upgradePrice = Number(import.meta.env.VITE_APP_BUILDER_UPSELL_PRICE || 187);
const regularUpgradePrice = Number(import.meta.env.VITE_APP_BUILDER_REGULAR_PRICE || 2100);

export default function CheckoutPage() {
  const [registration, setRegistration] = useState(null);
  const [addUpgrade, setAddUpgrade] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState(false);
  const checkoutCardRef = useRef(null);
  const active = Date.now() < earlyBirdEndsAt;
  const workshopPrice = active ? 150 : 200;
  const total = workshopPrice + (addUpgrade ? upgradePrice : 0);
  useEffect(() => {
    try { setRegistration(JSON.parse(window.sessionStorage.getItem('beaheadRegistration') || 'null')); } catch { setRegistration(null); }
  }, []);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => checkoutCardRef.current?.scrollIntoView({ block: 'start' }));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const continueToPayment = () => {
    const paymentUrl = addUpgrade ? upgradePaymentUrl : basePaymentUrl;
    if (paymentUrl) window.location.assign(paymentUrl);
    else setPaymentNotice(true);
  };
  return <main className="register-page checkout-page">
    <header className="rp-top"><a href="/#/register"><ArrowLeft size={18}/> Back to details</a><a className="rp-brand" href="/">Be<span>Ahead</span></a></header>
    <section className="rp-hero co-hero"><p>ONE MORE STEP · LIVE THIS SUNDAY</p><h1>Your workshop seat is <em>almost reserved.</em></h1><span>Check your order below. Add the extra live session only if you want it.</span></section>
    <div className="rp-layout co-layout">
      <section className="rp-form-card co-payment-card" ref={checkoutCardRef}>
        <div className="rp-card-title"><p>BEAHEAD LIVE CLAUDE & AI WORKSHOP</p><h2>Complete your registration</h2><span>Sunday, 9 August · 3:00 PM–6:00 PM IST · Live online</span></div>
        <div className="co-summary"><div><span>Live workshop seat</span><b>₹{workshopPrice}</b></div>{addUpgrade && <div className="co-summary-added"><span>Build With AI live upgrade</span><b>₹{upgradePrice}</b></div>}<div className="co-summary-total"><span>Total payable</span><b>₹{total}</b></div></div>
        <article className={`co-add-card ${addUpgrade ? 'is-added' : ''}`}>
          <div className="co-add-icon"><Sparkles/></div>
          <div className="co-add-copy"><p>OPTIONAL LIVE ADD-ON</p><h3>Want to learn how to build your own app with AI?</h3><span>Learn prompt engineering. Turn an idea into a simple app. Put it online and add a way for customers to pay — no coding needed.</span><small><Check/> Claude, Gemini, Perplexity & Codex · Live step by step</small></div>
          <div className="co-add-action"><span><s>₹{regularUpgradePrice.toLocaleString('en-IN')}</s> <b>₹{upgradePrice}</b></span><em>Save ₹{(regularUpgradePrice - upgradePrice).toLocaleString('en-IN')}</em><button onClick={() => setAddUpgrade(added => !added)} aria-pressed={addUpgrade}>{addUpgrade ? <><Check/> Added</> : <><Plus/> Add live session</>}</button></div>
        </article>
        <p className="co-choice-note">{addUpgrade ? 'The live Build With AI session is added to your order.' : 'You can continue with only the main AI workshop.'}</p>
        <div className="co-contact"><p><Mail/><span><b>{registration?.email || 'Your email'}</b>Confirmation will be sent here after payment.</span></p><p><Smartphone/><span><b>{registration?.phone || 'Your WhatsApp number'}</b>Workshop details will be sent here after payment.</span></p><a href="/#/register">Change details</a></div>
        <button className="rp-pay co-continue" onClick={continueToPayment}>Continue to secure payment · ₹{total} <ChevronRight size={18}/></button>
        {paymentNotice && <p className="rp-setup-note"><b>Payment links need to be connected.</b> Add the base and add-on links in Netlify before accepting payments. No personal information has been sent.</p>}
        <div className="rp-security"><article><LockKeyhole/><div><b>Secure checkout</b><span>Payment happens with your payment provider.</span></div></article><article><ShieldCheck/><div><b>Your details stay private</b><span>Used only for workshop registration.</span></div></article><article><Check/><div><b>Clear choice</b><span>The add-on is optional.</span></div></article></div>
      </section>
      <aside className="rp-summary co-side-summary"><p>YOUR LIVE WORKSHOP</p><h2>Sunday, 9 August</h2><div className="rp-invite"><span><b>WHEN</b>3:00 PM–6:00 PM IST</span><span><b>WHERE</b>Live online workshop</span><span><b>WITH</b>Shanjai Raj</span></div><div className="rp-value"><p>YOUR MAIN WORKSHOP</p><span><Check/> Work faster with Claude & AI</span><span><Check/> Make reports, Excel and PPT easier</span><span><Check/> Build an AI worker for repeat work</span><span><Check/> BeAhead workshop certificate</span></div><div className="rp-price" style={{ padding: 15 }}><span>{active ? <>Standard live-seat price <s>₹200</s></> : 'Current live-seat price'}</span><b>{active ? 'Today’s early-bird price' : 'Current price'}</b><strong style={{ fontSize: 36, letterSpacing: -2 }}>₹{workshopPrice}</strong>{active && <em>₹150 price ends at midnight</em>}</div></aside>
    </div>
  </main>;
}
