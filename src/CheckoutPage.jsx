import React, { useEffect, useRef, useState } from 'react';
import { initializePaddle } from '@paddle/paddle-js';
import { ArrowLeft, Check, ChevronRight, LoaderCircle, LockKeyhole, Mail, Plus, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import './register.css';
import './checkout.css';
import { checkPaddleAvailability, createManualReservation, flush, getSessionId, getVisitorId, saveLeadDraft, track } from './analytics';
import { trackMeta } from './metaPixel';

const paddleClientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN || '';
const workshopPriceId = import.meta.env.VITE_PADDLE_WORKSHOP_PRICE_ID || '';
const addonPriceId = import.meta.env.VITE_PADDLE_ADDON_PRICE_ID || '';
const bundlePriceId = import.meta.env.VITE_PADDLE_BUNDLE_PRICE_ID || '';
const workshopPrice = 150;
const upgradePrice = 342;
const regularUpgradePrice = Number(import.meta.env.VITE_APP_BUILDER_REGULAR_PRICE || 2100);

export default function CheckoutPage() {
  const [registration, setRegistration] = useState(null);
  const [addUpgrade, setAddUpgrade] = useState(false);
  const [paddleStatus, setPaddleStatus] = useState({ checking: true, available: false, reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState('');
  const checkoutCardRef = useRef(null);
  const paddleRef = useRef(null);
  const reserveRef = useRef(null);
  const checkoutTrackedRef = useRef(false);
  const total = workshopPrice + (addUpgrade ? upgradePrice : 0);
  const manualPaymentDue = total;

  useEffect(() => {
    try { setRegistration(JSON.parse(window.sessionStorage.getItem('madeForMoreRegistration') || 'null')); } catch { setRegistration(null); }
  }, []);
  useEffect(() => {
    let active = true;
    if (!workshopPriceId) {
      setPaddleStatus({ checking: false, available: false, reason: 'checkout_not_configured' });
      return undefined;
    }
    checkPaddleAvailability(workshopPriceId)
      .then((status) => { if (active) setPaddleStatus({ checking: false, ...status }); })
      .catch(() => { if (active) setPaddleStatus({ checking: false, available: false, reason: 'availability_check_failed' }); });
    return () => { active = false; };
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
    if (!paddleClientToken || !paddleStatus.available) return undefined;
    let active = true;
    initializePaddle({
      token: paddleClientToken,
      eventCallback: (event) => {
        if (event.name === 'checkout.error') {
          paddleRef.current?.Checkout.close();
          setPaddleStatus({ checking: false, available: false, reason: 'checkout_not_enabled' });
          setPaymentNotice('Paddle is not ready to take payments yet. Your early-bird seat can still be reserved below.');
          reserveRef.current?.();
          return;
        }
        if (event.name !== 'checkout.completed') return;
        const paidTotal = Number(event.data?.totals?.total || 0) / 100;
        const isBundle = event.data?.custom_data?.selected_offer === 'bundle';
        trackMeta('Purchase', {
          currency: event.data?.currency_code || 'INR',
          value: Number.isFinite(paidTotal) ? paidTotal : workshopPrice,
          content_name: isBundle ? 'Made for More workshop + Build With AI live add-on' : 'Made for More Live Claude & AI Workshop',
        }, { eventID: `paddle_${event.data?.transaction_id}` });
        window.sessionStorage.setItem('madeForMorePayment', JSON.stringify({
          addUpgrade: isBundle,
          total: Number.isFinite(paidTotal) ? paidTotal : workshopPrice,
          email: registration?.email || '',
          phone: registration?.phone || '',
        }));
      },
    }).then((paddle) => { if (active) paddleRef.current = paddle; }).catch(() => {
      if (active) setPaddleStatus({ checking: false, available: false, reason: 'paddle_unreachable' });
    });
    return () => { active = false; };
  }, [paddleStatus.available]);

  const reserveEarlyBirdSeat = async () => {
    if (!registration?.analyticsConsent) {
      window.location.assign('/#/register');
      return;
    }
    setIsSubmitting(true);
    setPaymentNotice('');
    try {
      track('manual_reservation_requested', { listed_amount: total, amount_due: manualPaymentDue, includes_addon: addUpgrade });
      flush();
      const result = await createManualReservation({
        first_name: registration.firstName,
        last_name: registration.lastName,
        email: registration.email,
        phone: registration.phone,
        profession: registration.profession,
        selected_offer: addUpgrade ? 'bundle' : 'workshop',
        listed_amount: total,
        discount_amount: 0,
        amount_due: manualPaymentDue,
      });
      track('manual_reservation_confirmed', { amount_due: manualPaymentDue, includes_addon: addUpgrade });
      flush();
      window.sessionStorage.setItem('madeForMoreManualReservation', JSON.stringify({ ...result, firstName: registration.firstName, email: registration.email, phone: registration.phone, addUpgrade, listedAmount: total, discountAmount: 0, amountDue: manualPaymentDue }));
      window.location.assign('/#/reservation-confirmed');
    } catch {
      setPaymentNotice('We could not reserve your seat. Please try again or email shanjairajdev@gmail.com.');
    } finally {
      setIsSubmitting(false);
    }
  };
  reserveRef.current = reserveEarlyBirdSeat;
  const continueToPayment = async () => {
    const priceId = addUpgrade ? bundlePriceId : workshopPriceId;
    if (!paddleStatus.available || !paddleRef.current || !priceId || (addUpgrade && !addonPriceId)) {
      await reserveEarlyBirdSeat();
      return;
    }
    track('paddle_checkout_opened', { total, includes_addon: addUpgrade });
    flush();
    try {
      paddleRef.current.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: registration?.email ? { email: registration.email } : undefined,
        customData: registration ? { first_name: registration.firstName, last_name: registration.lastName, email: registration.email, phone: registration.phone, profession: registration.profession, selected_offer: addUpgrade ? 'bundle' : 'workshop', visitor_id: getVisitorId(), session_id: getSessionId() } : undefined,
        settings: { displayMode: 'overlay', variant: 'one-page', theme: 'light', successUrl: `${window.location.origin}/#/payment-confirmed` },
      });
    } catch {
      setPaddleStatus({ checking: false, available: false, reason: 'checkout_not_enabled' });
      await reserveEarlyBirdSeat();
    }
  };
  const checkoutReady = paddleStatus.available;
  return <main className="register-page checkout-page">
    <header className="rp-top"><a href="/#/register"><ArrowLeft size={18}/> Back to details</a><a className="rp-brand" href="/">Made <span>for More</span></a></header>
    <section data-track-section="checkout-intro" className="rp-hero co-hero"><p>ONE MORE STEP · LIVE THIS SUNDAY</p><h1>Your workshop seat is <em>almost reserved.</em></h1><span>Check your order below. Add the extra live session only if you want it.</span></section>
    <div className="rp-layout co-layout">
      <section data-track-section="checkout" className="rp-form-card co-payment-card" ref={checkoutCardRef}>
        <div className="rp-card-title"><p>MADE FOR MORE LIVE CLAUDE & AI WORKSHOP</p><h2>Complete your registration</h2><span>Sunday, 9 August · 3:00 PM–6:00 PM IST · Live online</span></div>
        <div className="co-summary"><div><span>Live workshop seat</span><b>₹{workshopPrice}</b></div>{addUpgrade && <div className="co-summary-added"><span>Build With AI live upgrade</span><b>₹{upgradePrice}</b></div>}<div className="co-summary-total"><span>{checkoutReady ? 'Total payable' : 'Payment to be arranged'}</span><b>₹{total}</b></div></div>
        <article className={`co-add-card ${addUpgrade ? 'is-added' : ''}`}>
          <div className="co-add-icon"><Sparkles/></div>
          <div className="co-add-copy"><p>OPTIONAL LIVE ADD-ON</p><h3>Want to learn how to build your own app with AI?</h3><span>Learn prompt engineering. Turn an idea into a simple app. Put it online and add a way for customers to pay — no coding needed.</span><small><Check/> Claude, Gemini, Perplexity & Codex · Live step by step</small></div>
          <div className="co-add-action"><span><s>₹{regularUpgradePrice.toLocaleString('en-IN')}</s> <b>₹{upgradePrice}</b></span><em>Save ₹{(regularUpgradePrice - upgradePrice).toLocaleString('en-IN')}</em><button onClick={() => { const next = !addUpgrade; setAddUpgrade(next); track(next ? 'addon_selected' : 'addon_removed', { addon_price: upgradePrice }); if (next) trackMeta('AddToCart', { content_name: 'Build With AI live add-on', currency: 'INR', value: upgradePrice }); }} aria-pressed={addUpgrade}>{addUpgrade ? <><Check/> Added</> : <><Plus/> Add live session</>}</button></div>
        </article>
        <p className="co-choice-note">{addUpgrade ? 'The live Build With AI session is added to your order.' : 'You can continue with only the main AI workshop.'}</p>
        <div className="co-contact"><p><Mail/><span><b>{registration?.email || 'Your email'}</b>{checkoutReady ? 'Confirmation will be sent here after payment.' : 'Your payment details and joining information will be sent here.'}</span></p><p><Smartphone/><span><b>{registration?.phone || 'Your WhatsApp number'}</b>{checkoutReady ? 'Workshop details will be sent here after payment.' : 'Our workshop team will send your payment details here.'}</span></p><a href="/#/register">Change details</a></div>
        <button className="rp-pay co-continue" onClick={continueToPayment} disabled={isSubmitting || paddleStatus.checking}>{isSubmitting ? <><LoaderCircle className="co-loading" size={18}/> Reserving your early-bird seat…</> : paddleStatus.checking ? 'Checking secure payment…' : checkoutReady ? <>Continue to secure payment · ₹{total} <ChevronRight size={18}/></> : <>Reserve early-bird seat · ₹{manualPaymentDue} <ChevronRight size={18}/></>}</button>
        {!checkoutReady && !paddleStatus.checking && <p className="rp-setup-note"><b>Your seat request is not a payment.</b> The price stays at ₹{manualPaymentDue}. Our workshop team will send payment details to your WhatsApp and email.</p>}
        {paymentNotice && <p className="rp-setup-note"><b>Notice:</b> {paymentNotice}</p>}
        <div className="rp-security"><article><LockKeyhole/><div><b>{checkoutReady ? 'Secure checkout' : 'Secure seat request'}</b><span>{checkoutReady ? 'Payment happens with Paddle.' : 'No payment is taken on this page.'}</span></div></article><article><ShieldCheck/><div><b>Your details stay private</b><span>Used only for workshop registration.</span></div></article><article><Check/><div><b>Clear choice</b><span>The add-on is optional.</span></div></article></div><p className="co-policy-links"><a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/refunds.html">Refund policy</a></p>
      </section>
      <aside className="rp-summary rp-invitation co-side-summary"><p>YOUR LIVE WORKSHOP INVITATION</p><h2>Sunday, 9 August</h2><div className="rp-invite"><span><b>WHEN</b>3:00 PM–6:00 PM IST</span><span><b>WHERE</b>Live online workshop</span><span><b>WITH</b>Shanjai Raj</span></div><div className="rp-value"><p>YOUR MAIN WORKSHOP</p><span><Check/> Work faster with Claude & AI</span><span><Check/> Make reports, Excel and PPT easier</span><span><Check/> Build an AI worker for repeat work</span><span><Check/> Made for More workshop certificate</span></div><div className="rp-invite-price"><span>Early-bird live seat</span><b>₹{workshopPrice}</b></div></aside>
    </div>
  </main>;
}
