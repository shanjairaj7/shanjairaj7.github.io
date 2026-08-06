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
    <section className="rp-hero reservation-hero"><TicketCheck size={28}/><p>EARLY-BIRD SEAT REQUEST RECEIVED</p><h1>Your seat is <em>reserved.</em></h1><span>Thank you for being one of the earliest people to join this live workshop.</span></section>
    <section className="reservation-card">
      <div className="reservation-icon"><CheckCircle2/></div>
      <h2>What happens next</h2>
      <p className="reservation-name">{reservation?.firstName ? `${reservation.firstName}, ` : ''}your early-bird seat request is saved.</p>
      <div className="reservation-amounts"><div><span>Workshop order</span><b>₹{reservation?.listedAmount ?? 150}</b></div><div><span>Payment to arrange</span><b>₹{reservation?.amountDue ?? 150}</b></div></div>
      {reservation?.addUpgrade && <p className="reservation-addon"><CheckCircle2/> Your optional Build With AI live add-on is included.</p>}
      <div className="reservation-contact"><p><Smartphone/><span><b>WhatsApp</b>Payment details will be sent to <strong>{reservation?.phone || 'your registered number'}</strong>.</span></p><p><Mail/><span><b>Email</b>Joining information will be sent to <strong>{reservation?.email || 'your registered email'}</strong>.</span></p></div>
      <p className="reservation-note">Your place is confirmed after the payment is completed. Please wait for the workshop team’s message with the payment details.</p>
      <a className="rp-pay reservation-link" href="/#/">View workshop details <ChevronRight size={18}/></a>
    </section>
  </main>;
}
