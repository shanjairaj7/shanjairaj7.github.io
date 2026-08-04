import React, { useEffect, useRef, useState } from 'react';
import { initializePaddle } from '@paddle/paddle-js';
import { ArrowLeft, Check, ChevronRight, LockKeyhole, Mail, Plus, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import './register.css';
import './checkout.css';
import { flush, getSessionId, getVisitorId, saveLeadDraft, track } from './analytics';
import { trackMeta } from './metaPixel';

const paddleClientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN || '';
const workshopPriceId = import.meta.env.VITE_PADDLE_WORKSHOP_PRICE_ID || '';
const addonPriceId = import.meta.env.VITE_PADDLE_ADDON_PRICE_ID || '';
const bundlePriceId = import.meta.env.VITE_PADDLE_BUNDLE_PRICE_ID || '';
const upgradePrice = 342;
const workshopPrice = 150;
const regularUpgradePrice = Number(import.meta.env.VITE_APP_BUILDER_REGULAR_PRICE || 2100);

export default function CheckoutPage() {
  const [registration, setRegistration] = useState(null);
  const [addUpgrade, setAddUpgrade] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState(false);
  const checkoutCardRef = useRef(null);
  const paddleRef = useRef(null);
  const checkoutTrackedRef = useRef(false);
  const total = workshopPrice + (addUpgrade ? upgradePrice : 0);
  useEffect(() => {
    try { setRegistration(JSON.parse(window.sessionStorage.getItem('madeForMoreRegistration') || 'null')); } catch { setRegistration(null); }
  }, []);
  useEffect(() => {
    if (!registration || checkoutTrackedRef.current) return;
    checkoutTrackedRef.current = true;
    track('checkout_viewed', { workshop_price: workshopPrice });
    trackMeta('InitiateCheckout', { content_name: 'Made for More Live Claude & AI Workshop', currency: 'INR', value: workshopPrice });
    if (registration.analyticsConsent) saveLeadDraft({ ...registration, consent: true, checkoutViewed: true });
  }, [registration]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => checkoutCardRef.current?.scrollIntoView({ block: 'start' }));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!paddleClientToken) return undefined;
    let active = true;
    initializePaddle({ token: paddleClientToken }).then((paddle) => { if (active) paddleRef.current = paddle; });
    return () => { active = false; };
  }, []);
  const continueToPayment = () => {
    const priceId = addUpgrade ? bundlePriceId : workshopPriceId;
    if (!paddleRef.current || !priceId || (addUpgrade && !addonPriceId)) { setPaymentNotice(true); return; }
    track('paddle_checkout_opened', { total, includes_addon: addUpgrade });
    flush();
    paddleRef.current.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: registration?.email ? { email: registration.email } : undefined,
      customData: registration ? { first_name: registration.firstName, last_name: registration.lastName, email: registration.email, phone: registration.phone, profession: registration.profession, selected_offer: addUpgrade ? 'bundle' : 'workshop', visitor_id: getVisitorId(), session_id: getSessionId() } : undefined,
      settings: { displayMode: 'overlay', variant: 'one-page', theme: 'light', successUrl: `${window.location.origin}/#/?payment=success` },
    });
  };
  return <main className="register-page checkout-page">
    <header className="rp-top"><a href="/#/register"><ArrowLeft size={18}/> Back to details</a><a className="rp-brand" href="/">Made <span>for More</span></a></header>
    <section data-track-section="checkout-intro" className="rp-hero co-hero"><p>ONE MORE STEP · LIVE THIS SUNDAY</p><h1>Your workshop seat is <em>almost reserved.</em></h1><span>Check your order below. Add the extra live session only if you want it.</span></section>
    <div className="rp-layout co-layout">
      <section data-track-section="checkout" className="rp-form-card co-payment-card" ref={checkoutCardRef}>
        <div className="rp-card-title"><p>MADE FOR MORE LIVE CLAUDE & AI WORKSHOP</p><h2>Complete your registration</h2><span>Sunday, 9 August · 3:00 PM–6:00 PM IST · Live online</span></div>
        <div className="co-summary"><div><span>Live workshop seat</span><b>₹{workshopPrice}</b></div>{addUpgrade && <div className="co-summary-added"><span>Build With AI live upgrade</span><b>₹{upgradePrice}</b></div>}<div className="co-summary-total"><span>Total payable</span><b>₹{total}</b></div></div>
        <article className={`co-add-card ${addUpgrade ? 'is-added' : ''}`}>
          <div className="co-add-icon"><Sparkles/></div>
          <div className="co-add-copy"><p>OPTIONAL LIVE ADD-ON</p><h3>Want to learn how to build your own app with AI?</h3><span>Learn prompt engineering. Turn an idea into a simple app. Put it online and add a way for customers to pay — no coding needed.</span><small><Check/> Claude, Gemini, Perplexity & Codex · Live step by step</small></div>
          <div className="co-add-action"><span><s>₹{regularUpgradePrice.toLocaleString('en-IN')}</s> <b>₹{upgradePrice}</b></span><em>Save ₹{(regularUpgradePrice - upgradePrice).toLocaleString('en-IN')}</em><button onClick={() => { const next = !addUpgrade; setAddUpgrade(next); track(next ? 'addon_selected' : 'addon_removed', { addon_price: upgradePrice }); if (next) trackMeta('AddToCart', { content_name: 'Build With AI live add-on', currency: 'INR', value: upgradePrice }); }} aria-pressed={addUpgrade}>{addUpgrade ? <><Check/> Added</> : <><Plus/> Add live session</>}</button></div>
        </article>
        <p className="co-choice-note">{addUpgrade ? 'The live Build With AI session is added to your order.' : 'You can continue with only the main AI workshop.'}</p>
        <div className="co-contact"><p><Mail/><span><b>{registration?.email || 'Your email'}</b>Confirmation will be sent here after payment.</span></p><p><Smartphone/><span><b>{registration?.phone || 'Your WhatsApp number'}</b>Workshop details will be sent here after payment.</span></p><a href="/#/register">Change details</a></div>
        <button className="rp-pay co-continue" onClick={continueToPayment}>Continue to secure payment · ₹{total} <ChevronRight size={18}/></button>
        {paymentNotice && <p className="rp-setup-note"><b>Secure checkout is not ready yet.</b> Please refresh the page and try again. If the problem continues, email shanjairajdev@gmail.com.</p>}
        <div className="rp-security"><article><LockKeyhole/><div><b>Secure checkout</b><span>Payment happens with Paddle.</span></div></article><article><ShieldCheck/><div><b>Your details stay private</b><span>Used only for workshop registration.</span></div></article><article><Check/><div><b>Clear choice</b><span>The add-on is optional.</span></div></article></div><p className="co-policy-links"><a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/refunds.html">Refund policy</a></p>
      </section>
      <aside className="rp-summary co-side-summary"><p>YOUR LIVE WORKSHOP</p><h2>Sunday, 9 August</h2><div className="rp-invite"><span><b>WHEN</b>3:00 PM–6:00 PM IST</span><span><b>WHERE</b>Live online workshop</span><span><b>WITH</b>Shanjai Raj</span></div><div className="rp-value"><p>YOUR MAIN WORKSHOP</p><span><Check/> Work faster with Claude & AI</span><span><Check/> Make reports, Excel and PPT easier</span><span><Check/> Build an AI worker for repeat work</span><span><Check/> Made for More workshop certificate</span></div><div className="rp-price" style={{ padding: 15 }}><span>One-time live workshop access</span><b>Today’s price</b><strong style={{ fontSize: 36, letterSpacing: -2 }}>₹{workshopPrice}</strong></div></aside>
    </div>
  </main>;
}
