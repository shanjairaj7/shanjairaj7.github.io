import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, Check, ChevronDown, Clock3, Code2, Layers3, PlayCircle, Rocket, ShieldCheck, Sparkles, Users } from 'lucide-react';
import './styles.css';
import BeAheadAiWorkshop from './BeAheadAiWorkshop';
import RegisterPage from './RegisterPage';
import CheckoutPage from './CheckoutPage';

const scrollToOffer = () => document.querySelector('#enrol')?.scrollIntoView({ behavior: 'smooth' });

function Countdown() {
  const [time, setTime] = useState(3 * 3600 + 47 * 60 + 18);
  useEffect(() => { const timer = setInterval(() => setTime(v => v > 0 ? v - 1 : 4 * 3600), 1000); return () => clearInterval(timer); }, []);
  const parts = [Math.floor(time / 3600), Math.floor(time / 60) % 60, time % 60].map(v => String(v).padStart(2, '0'));
  return <div className="countdown" aria-label="Offer time remaining"><span>Offer closes in</span><b>{parts[0]}:{parts[1]}:{parts[2]}</b></div>;
}

const CTA = ({ label = 'Save your seat now' }) => <button className="cta" onClick={scrollToOffer}>{label} <ArrowRight size={18}/></button>;

const outcomes = [
  ['From idea to clear plan', 'Turn the app in your head into a simple, buildable product brief AI can understand.'],
  ['A working first version', 'Create screens, flows and real features without waiting for a developer to start.'],
  ['Your own launch path', 'Learn how to test, publish and share an installable app people can actually use.'],
  ['Faster decisions, less risk', 'Validate demand early—before you spend months or lakhs on the wrong build.'],
  ['A builder’s toolkit', 'Know which AI tools help with product, design, code and troubleshooting.'],
  ['Confidence to keep going', 'Replace “I’m not technical” with a repeatable process you can use again.'],
];
const audience = ['Aspiring founders with an app idea they have been sitting on', 'Working professionals who want to build a useful side project or business', 'Creators and consultants ready to turn expertise into a digital product', 'Small-business owners tired of being dependent on expensive software vendors', 'Anyone who wants to launch, test or prototype without learning to code first'];
const modules = [
  ['01', 'Choose the right app to build first', 'Find the smallest useful version of your idea and map what users need.'],
  ['02', 'Tell AI exactly what to create', 'Use product prompts that turn fuzzy thoughts into features, screens and flows.'],
  ['03', 'Build the experience visually', 'Create a clean first version with AI-powered tools—no technical background assumed.'],
  ['04', 'Make it work in the real world', 'Add forms, data, user actions and the essentials that make it feel like a product.'],
  ['05', 'Test, fix and improve with AI', 'Use AI as your patient product and troubleshooting partner instead of hiring help for every block.'],
  ['06', 'Launch it for people to use', 'Prepare your app to share, install and improve with real user feedback.'],
];
const faqs = [
  ['Do I need to know coding?', 'No. The workshop is built for people who can explain an idea but do not want to become developers. You will see a practical AI-first workflow, step by step.'],
  ['Can I build any kind of app?', 'You will learn the process for turning many common app ideas into a first working product. Complex, regulated or large-scale apps may need specialist help later—but you will know how to validate and direct that work.'],
  ['Will this be live?', 'Yes. This is a live, interactive online workshop. You can follow along and use the framework on your own idea.'],
  ['Is this only for startup founders?', 'Not at all. It is for professionals, creators, consultants and small-business owners who want to make something useful without a traditional development team.'],
  ['What happens after I enrol?', 'You will receive the session details and access information by email. Bring your app idea and a laptop if you can.'],
];

function AppIdeaWorkshop() {
 const [openFaq, setOpenFaq] = useState(0);
 return <><div className="top-strip"><Sparkles size={15}/> Live, hands-on online workshop · Seats for this batch are limited <Countdown/></div>
 <main>
  <section className="hero section">
   <nav><a className="brand" href="#top"><span>upskill</span><b>AI</b></a><div className="nav-proof"><Users size={16}/> Built for people with ideas</div></nav>
   <div className="hero-grid" id="top"><div className="hero-copy">
    <div className="chips"><span>NO CODING</span><span>NO TECH</span><span>NO PROBLEM</span></div>
    <p className="eyebrow">LIVE 3-HOUR AI APP-BUILDING WORKSHOP</p>
    <h1>Build your own <em>app with AI.</em></h1>
    <p className="lead">Stop waiting for a developer. Build your idea yourself—live with us—and leave knowing how to make a real app people can use and install.</p>
    <div className="hero-actions"><CTA label="Join the live workshop"/><div className="price-inline"><small>Live workshop access</small><strong>₹150</strong><s>₹1,499</s></div></div>
    <div className="trust"><span><Check size={15}/> Beginner-friendly</span><span><Check size={15}/> Practical & live</span><span><Check size={15}/> Bring your own idea</span></div>
   </div><div className="hero-visual"><div className="glow"></div><div className="build-window"><div className="window-head"><i></i><i></i><i></i><span>your-app / prototype</span></div><div className="app-preview"><div className="preview-nav"><b>freshplate</b><span>Menu</span><span>Orders</span></div><h3>Good food, nearby.</h3><p>Discover home chefs around you.</p><div className="food-cards"><div></div><div></div><div></div></div><button>Explore kitchens</button></div></div><div className="floating-card prompt"><Sparkles size={18}/><span>Describe your idea</span><b>AI turns it into a plan</b></div><div className="floating-card launch"><Rocket size={18}/><span>Ready to share</span><b>Build → Test → Launch</b></div></div></div>
   <div className="session-bar"><div><Clock3/><span><b>3 hours</b> live & hands-on</span></div><div><PlayCircle/><span><b>Online session</b> in simple English</span></div><div><Layers3/><span><b>Sunday, 11 AM</b> next live batch</span></div><CTA label="Join now for ₹150"/></div>
  </section>
  <section className="section proof"><p className="eyebrow">THE COST OF WAITING IS REAL</p><h2>Great ideas do not fail because they are bad.<br/><em>They fail because they stay stuck in someone’s head.</em></h2><div className="pain-grid"><div><span>01</span><h3>“A developer quoted more than I can afford.”</h3><p>So the idea gets pushed to next month. Again.</p></div><div><span>02</span><h3>“The agency doesn’t understand what I want.”</h3><p>You pay, wait, and still feel out of control.</p></div><div><span>03</span><h3>“I’m not technical enough to begin.”</h3><p>So you never get the clarity that comes from building.</p></div></div><div className="callout"><Code2/><p>AI has changed the starting line. You no longer need permission—or a large team—to make your first product real.</p></div></section>
  <section className="section dark outcomes"><p className="eyebrow">AFTER THIS WORKSHOP</p><h2>You will know how to move<br/>from <em>“someday” to shipped.</em></h2><div className="outcome-grid">{outcomes.map(([title, text], i) => <article key={title}><span>0{i+1}</span><Check/><h3>{title}</h3><p>{text}</p></article>)}</div><CTA label="Yes, I want to build"/></section>
  <section className="section audience"><div className="section-heading"><div><p className="eyebrow">WHO THIS IS FOR</p><h2>You don’t need to be a “tech person.”<br/><em>You need an idea worth moving on.</em></h2></div><div className="scribble">If you have ever said<br/><b>“I wish someone would build this…”</b><br/>this is for you.</div></div><div className="audience-list">{audience.map((item,i)=><div key={item}><b>0{i+1}</b><p>{item}</p><ArrowRight size={20}/></div>)}</div></section>
  <section className="section curriculum"><p className="eyebrow">YOUR LIVE BUILDING ROADMAP</p><h2>Six steps between your<br/>idea and its first users.</h2><div className="module-list">{modules.map(([num,title,text])=><article key={num}><b>{num}</b><div><h3>{title}</h3><p>{text}</p></div><span><ArrowRight/></span></article>)}</div><CTA label="Get the complete roadmap"/></section>
  <section className="section contrast"><p className="eyebrow">A NEW WAY TO BUILD</p><h2>From dependent to <em>dangerously capable.</em></h2><div className="compare"><div className="before"><h3>Before</h3><p>Waiting weeks for someone to understand your idea</p><p>₹₹₹ spent before you know if users want it</p><p>Feeling lost whenever something technical appears</p><p>A pitch deck instead of a product</p></div><div className="after"><h3>After</h3><p>Turning your idea into an actionable build plan</p><p>Testing a real version before big spending</p><p>Using AI to guide your next step and fix problems</p><p>A link or installable app you can put in front of users</p></div></div></section>
  <section className="section instructor"><div className="instructor-card"><div className="portrait"><div className="portrait-circle">AL</div><span>AI PRODUCT<br/>BUILDERS</span></div><div><p className="eyebrow">LEARN FROM PEOPLE WHO BUILD</p><h2>Practical guidance from experienced AI product builders.</h2><p className="lead">This workshop is led by operators who run companies and help other companies put AI to work. No theory-heavy lectures—just the decisions, tools and workflows that help a good idea get moving.</p><div className="credentials"><span><ShieldCheck/> Company builders</span><span><ShieldCheck/> AI implementation partners</span><span><ShieldCheck/> Product-first practitioners</span></div></div></div></section>
  <section className="section bonuses"><p className="eyebrow">ENROL TODAY & GET MORE THAN THE SESSION</p><h2>Everything you need to keep<br/><em>building after the workshop.</em></h2><div className="bonus-grid"><article><span>Bonus 01</span><h3>The App Idea Clarity Kit</h3><p>Prompts and worksheets to turn your rough thought into a sharp product brief.</p><b>Worth ₹1,499</b></article><article><span>Bonus 02</span><h3>50 AI Builder Prompts</h3><p>Ready-to-adapt prompts for screens, features, testing, launch copy and more.</p><b>Worth ₹1,999</b></article><article><span>Bonus 03</span><h3>Launch-Ready Checklist</h3><p>A simple checklist for sharing your first version with real people.</p><b>Worth ₹999</b></article></div></section>
  <section className="section testimonials"><p className="eyebrow">THE KIND OF MOMENTUM YOU’RE HERE FOR</p><h2>Not more ideas. <em>More things in the world.</em></h2><div className="quote-grid"><article><div className="stars">★★★★★</div><p>“I finally understood what to build first instead of trying to build everything. I left with a version I could show people.”</p><footer><b>Workshop participant</b><span>Founder, early-stage venture</span></footer></article><article><div className="stars">★★★★★</div><p>“The biggest shift was realising I don’t have to wait until I can afford an agency to test my idea.”</p><footer><b>Workshop participant</b><span>Independent consultant</span></footer></article><article><div className="stars">★★★★★</div><p>“It made the technical side feel approachable. I went from overwhelmed to excited about my next step.”</p><footer><b>Workshop participant</b><span>Working professional</span></footer></article></div><small className="placeholder-note">Illustrative participant-story placeholders; replace with verified attendee testimonials before publishing.</small></section>
  <section id="enrol" className="section offer"><div className="offer-card"><div><p className="eyebrow">NEXT LIVE BATCH · SUNDAY 11:00 AM</p><h2>Build the app you have been <em>putting off.</em></h2><p>One live workshop. A process you can reuse for every idea after this.</p><div className="offer-includes"><span><Check/> 3-hour live workshop</span><span><Check/> All 3 implementation bonuses</span><span><Check/> Beginner-first AI app workflow</span></div></div><div className="price-card"><span>Workshop access</span><div><s>₹1,499</s><strong>₹150</strong></div><small>One-time payment · limited seats</small><Countdown/><CTA label="Join now for ₹150"/><p>Secure checkout · Instant confirmation</p></div></div></section>
  <section className="section faq"><p className="eyebrow">FREQUENTLY ASKED QUESTIONS</p><h2>Questions are normal.<br/><em>Staying stuck is optional.</em></h2><div>{faqs.map(([q,a],i)=><article className={openFaq === i ? 'open' : ''} key={q}><button onClick={()=>setOpenFaq(openFaq===i?-1:i)}><span>{q}</span><ChevronDown/></button>{openFaq===i&&<p>{a}</p>}</article>)}</div></section>
 </main><footer><a className="brand" href="#top"><span>upskill</span><b>AI</b></a><p>Build boldly. Start simply.</p><span>© 2026 upskillAI</span></footer><div className="mobile-cta"><span><b>₹150</b><small> Live workshop</small></span><CTA label="Join now"/></div></>;
}
const pathname = window.location.pathname.replace(/\/$/, '');
const hashPath = window.location.hash.replace(/^#/, '').split('#')[0].replace(/\/$/, '');
const pagePath = pathname === '' ? hashPath : pathname;
const page = pagePath === '/build-app-with-ai' ? <AppIdeaWorkshop/> : pagePath === '/register' ? <RegisterPage/> : pagePath === '/checkout' ? <CheckoutPage/> : <BeAheadAiWorkshop/>;
createRoot(document.getElementById('root')).render(page);
