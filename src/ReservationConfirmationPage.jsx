import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, Mail, Smartphone, TicketCheck } from 'lucide-react';
import './register.css';
import './checkout.css';

export default function ReservationConfirmationPage() {
  const [reservation, setReservation] = useState(null);
  useEffect(() => {
    try { setReservation(JSON.parse(window.sessionStorage.getItem('madeForMoreManualReservation') || 'null')); } catch { setReservation(null); }
  }, []);
  return <main className="register-page reservation-page">
    <header className="rp-top"><a href="/#/">Made <span>for More</span></a><a className="rp-brand" href="/#/">Back to workshop</a></header>
    <section className="rp-hero reservation-hero"><TicketCheck size={28}/><p>REGISTRATION RECEIVED · EARLY-BIRD SEAT HELD</p><h1>You are <em>registered.</em></h1><span>Your early-bird workshop seat is now held for you.</span></section>
    <section className="reservation-card">
      <div className="reservation-icon"><CheckCircle2/></div>
      <h2>Here is what happens next</h2>
      <p className="reservation-name">{reservation?.firstName ? `${reservation.firstName}, ` : ''}thank you for registering early.</p>
      <div className="reservation-amounts"><div><span>Workshop order</span><b>₹{reservation?.listedAmount ?? 150}</b></div><div><span>Payment to arrange</span><b>₹{reservation?.amountDue ?? 150}</b></div></div>
      {reservation?.addUpgrade && <p className="reservation-addon"><CheckCircle2/> Your optional Build With AI live add-on is included.</p>}
      <div className="reservation-contact"><p><Smartphone/><span><b>I will contact you on WhatsApp</b>Payment details will be sent to <strong>{reservation?.phone || 'your registered number'}</strong>.</span></p><p><Mail/><span><b>Workshop information by email</b>Joining information will be sent to <strong>{reservation?.email || 'your registered email'}</strong>.</span></p></div>
      <p className="reservation-note"><b>Your seat is held.</b> Please complete the payment when I send the details. Then your final live-workshop entry is locked in.</p>
      <a className="rp-pay reservation-link" href="/#/">View workshop details <ChevronRight size={18}/></a>
    </section>
  </main>;
}
