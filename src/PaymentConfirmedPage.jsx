import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, Mail, Smartphone, TicketCheck } from 'lucide-react';
import './register.css';
import './checkout.css';

export default function PaymentConfirmedPage() {
  const [payment, setPayment] = useState(null);
  useEffect(() => {
    try { setPayment(JSON.parse(window.sessionStorage.getItem('madeForMorePayment') || 'null')); } catch { setPayment(null); }
  }, []);
  return <main className="register-page reservation-page">
    <header className="rp-top"><a href="/#/">Made <span>for More</span></a><a className="rp-brand" href="/#/">Back to workshop</a></header>
    <section className="rp-hero reservation-hero"><TicketCheck size={28}/><p>PAYMENT RECEIVED</p><h1>You are <em>in.</em></h1><span>Your Made for More live workshop seat is confirmed.</span></section>
    <section className="reservation-card">
      <div className="reservation-icon"><CheckCircle2/></div>
      <h2>See you this Sunday</h2>
      <p className="reservation-name">Live online · Sunday, 9 August · 3:00 PM–6:00 PM IST</p>
      <div className="reservation-amounts"><div><span>Amount paid</span><b>₹{payment?.total ?? 150}</b></div><div><span>Workshop access</span><b>Confirmed</b></div></div>
      {payment?.addUpgrade && <p className="reservation-addon"><CheckCircle2/> Your Build With AI live add-on is included.</p>}
      <div className="reservation-contact"><p><Smartphone/><span><b>WhatsApp</b>Workshop joining details will be sent to <strong>{payment?.phone || 'your registered number'}</strong>.</span></p><p><Mail/><span><b>Email</b>Confirmation details will be sent to <strong>{payment?.email || 'your registered email'}</strong>.</span></p></div>
      <a className="rp-pay reservation-link" href="/#/">View workshop details <ChevronRight size={18}/></a>
    </section>
  </main>;
}
