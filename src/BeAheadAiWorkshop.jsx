import React, { useEffect, useState } from 'react';
import {
  ArrowRight, Check, ChevronDown, Clock3, Code2, Layers3,
  MessageCircle, ShieldCheck, Sparkles, Wand2, Zap
} from 'lucide-react';
import './beahead-ai.css';
import './beahead-mobile.css';
import './urgency.css';
import './offer-details.css';

const enrol = () => { window.location.href = '/#/register'; };
const CTA = ({ children = 'Reserve my live seat' }) => <button className="ba-cta" onClick={enrol}>{children}<ArrowRight size={17}/></button>;

const registrationClosesAt = new Date('2026-08-09T14:00:00+05:30').getTime();

function EarlyBirdTimer({ compact = false }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const remaining = Math.max(0, registrationClosesAt - now);
  const active = remaining > 0;
  const hours = String(Math.floor(remaining / 3_600_000)).padStart(2, '0');
  const minutes = String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, '0');
  const seconds = String(Math.floor((remaining % 60_000) / 1_000)).padStart(2, '0');
  if (!active) return <span className={compact ? 'ba-timer-compact' : 'ba-timer'}>REGISTRATION IS NOW CLOSED</span>;
  return <span className={compact ? 'ba-timer-compact' : 'ba-timer'}><b>REGISTRATION CLOSES IN</b> <strong>{hours}:{minutes}:{seconds}</strong> <small>one hour before the live workshop</small></span>;
}

function MediaSlot({ label, note, className = '', src }) {
  if (src) return <div className={`ba-media-slot ${className}`} style={{ overflow: 'hidden', padding: 0, borderStyle: 'solid' }}>
    <img src={src} alt={label} width="1448" height="1086" loading={className.includes('portrait') ? 'lazy' : 'eager'} fetchPriority={className.includes('portrait') ? 'auto' : 'high'} decoding="async" style={{ width: '100%', height: '100%', minHeight: 'inherit', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}/>
  </div>;
  return <div className={`ba-media-slot ${className}`}>
    <span>ADD YOUR IMAGE</span>
    <strong>{label}</strong>
    <small>{note}</small>
  </div>;
}

const tasks = [
  ['Finish reports faster', 'Start with a clear first draft. No more staring at a blank screen for one hour.'],
  ['Make Excel work easy', 'Ask AI for formulas, clean data and simple summaries when you get stuck.'],
  ['Make PPT in minutes', 'Turn your rough points into a clear presentation that you can show with confidence.'],
  ['Create better ideas', 'Make images, ad ideas and content when your team needs something new.'],
  ['Build your own AI worker', 'Build an AI worker that can do repeat work for you in the background—like a small team member you can message on Telegram.'],
  ['Get ahead of basic ChatGPT users', 'Learn simple AI workflows so you do more than ask one question at a time.'],
];

const audiences = [
  'You make reports, PPT, Excel sheets, emails or research at work.',
  'You want to finish your work faster and leave on time more often.',
  'You want your manager to see better work from you.',
  'You want to learn AI, but you do not know where to start.',
  'You do not want to be the last person in your team to learn AI.',
];

const modules = [
  ['01', 'Find where AI can save your time', 'See the small daily tasks you should stop doing by hand.'],
  ['02', 'Use ChatGPT for daily work', 'Use it for reports, emails, research and documents.'],
  ['03', 'Use AI with Excel', 'Get help with formulas, data and summaries without fear.'],
  ['04', 'Make PPT, images and ads', 'Turn one simple idea into better work you can use.'],
  ['05', 'Build your own AI worker', 'Build a real AI worker step by step. Message it on Telegram. Give it repeat work. Let it work for you in the background.'],
  ['06', 'See what comes next', 'Learn the simple path to automation, an AI team and your own app idea.'],
];

const faqs = [
  ['Do I need coding or technical knowledge?', 'No. You only need to know how to use a laptop for work. Everything is shown in simple English, step by step.'],
  ['What do I need to join?', 'Bring a laptop and internet if possible. You can follow with your own report, PPT, Excel work or any work problem.'],
  ['Will the session be live?', 'Yes. This is a live online workshop with Shanjai Raj on Sunday, 9 August, from 3:00 PM to 6:00 PM IST.'],
  ['Will I build an AI worker in this workshop?', 'Yes. You will build your own simple AI worker live. You can message it on Telegram and give it repeat work to do for you in the background.'],
  ['Is this only for IT people?', 'No. This is for anyone who works on a laptop. You do not need an IT job to use AI well.'],
  ['What happens after I join?', 'You will get the joining details for the live workshop. Payment, support and refund details will be added before launch.'],
];

const companyUpdates = [
  ['Amazon', 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/amazon.svg', '14,000 CORPORATE JOBS CUT', 'Amazon announced these cuts in 2025. Its CEO also says AI and agents can reduce corporate workforce over time.', 'https://www.aboutamazon.com/news/company-news/amazon-workforce-reduction', 'Read Amazon’s update'],
  ['Shopify', 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/shopify.svg', '23% OF THE TEAM CUT', 'Shopify reported this 2023 cut. Now its teams must show why AI cannot do the work before asking for more people.', 'https://shopifyinvestors.gcs-web.com/static-files/842873b3-6bab-44a6-83e1-1e4c3e8b58e1', 'Read Shopify’s filing'],
  ['Microsoft', 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg', '4,800 JOBS CUT', 'Microsoft eliminated around 4,800 roles in July 2026 while changing focus in a fast-moving industry.', 'https://blogs.microsoft.com/blog/2026/07/06/the-latest-in-our-company-transformation/', 'Read the company update'],
];

const toolLogos = [
  ['ChatGPT', 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/openai.svg'],
  ['Claude', 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/anthropic.svg'],
  ['Gemini', 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/googlegemini.svg'],
  ['Excel', 'https://img.icons8.com/color/96/microsoft-excel-2019--v1.png'],
  ['PowerPoint', 'https://img.icons8.com/color/96/microsoft-powerpoint-2019--v1.png'],
];

export default function MadeForMoreAiWorkshop() {
  const [open, setOpen] = useState(0);
  return <div className="beahead-page">
    <div className="ba-alert"><Sparkles size={14}/> LIVE THIS SUNDAY · 9 AUGUST · 3:00 PM–6:00 PM IST <EarlyBirdTimer compact/> <a href="/#/register">Register now</a></div>
    <main>
      <section className="ba-hero" id="top">
        <nav className="ba-nav"><a href="/" className="ba-brand">Made <span>for More</span></a><span>Live AI workshop for working professionals</span></nav>
        <div className="ba-hero-grid">
          <div>
            <div className="ba-chips"><span>NO CODING</span><span>NO TECH</span><span>NO PROBLEM</span></div>
            <p className="ba-kicker" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 19 }}><img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/anthropic.svg" alt="Claude logo" style={{ width: 24, height: 24, filter: 'invert(1)' }}/> LIVE 3-HOUR CLAUDE & AI WORKSHOP</p>
            <h1 style={{ fontWeight: 700, letterSpacing: '-2.6px', lineHeight: 1.16 }}>Still working late because your work takes <em>too long?</em></h1>
            <p className="ba-lead"><b>Learn ChatGPT & AI tools for your daily work.</b> Make reports, Excel, PPT and research faster. Save time. Do better work. Become the AI person in your team.</p>
            <div className="ba-hero-actions"><CTA>Join the live workshop</CTA><div className="ba-price"><small>Live workshop access</small><strong>₹150</strong></div></div>
            <div className="ba-points" style={{ marginTop: 28, gap: 11 }}><span style={{ fontSize: 15 }}><Check/> Become the AI person your team depends on</span><span style={{ fontSize: 15 }}><Check/> No technical or AI knowledge required</span><span style={{ fontSize: 15 }}><Check/> Save up to 2.5 hours every day</span><span style={{ fontSize: 15 }}><Check/> Build your own AI worker for repeat work</span></div>
            <p className="ba-hero-fomo"><b>Sunday will come anyway.</b> Start next week with a new skill. Do not keep saying, “I will learn AI later.”</p>
            <div className="ba-hero-credibility" style={{ marginTop: 19, display: 'grid', gap: 8, fontSize: 13, lineHeight: 1.35 }}><span><b style={{ color: '#ff7a16' }}>→</b> Get a Made for More workshop certificate for your resume</span><span><b style={{ color: '#ff7a16' }}>→</b> Learn from Shanjai Raj — built products with seven-figure revenue</span><span><b style={{ color: '#ff7a16' }}>→</b> Be ready before AI becomes a basic job requirement</span><span><b style={{ color: '#ff7a16' }}>→</b> Learn the tools Shanjai has tested for 1,000+ hours</span></div>
          </div>
          <div className="ba-hero-media"><MediaSlot src="/images/shanjai-raj-workshop.jpg" label="Shanjai Raj, Made for More workshop instructor"/><div className="ba-float ba-float-one"><Wand2/><b>From manual work</b><span>to AI-assisted work</span></div><div className="ba-float ba-float-two"><Zap/><b>One live session</b><span>practical workflows</span></div></div>
        </div>
        <div className="ba-session"><div><Clock3/><span><b>Sunday, 9 August</b>3:00 PM–6:00 PM IST</span></div><div><MessageCircle/><span><b>Live online</b>simple English, step by step</span></div><div><Layers3/><span><b>3 hours</b>guided practical workshop</span></div><CTA>Reserve my seat · ₹150</CTA></div>
      </section>

      <section className="ba-section ba-pain">
        <p className="ba-kicker">DOES THIS HAPPEN TO YOU?</p><h2>You are not slow. You are doing too much work <em>by hand.</em></h2>
        <p className="ba-pain-intro">One small task becomes a report. Then a PPT. Then a “small change” from your manager. Your day is gone before your real work is done.</p>
        <div className="ba-pain-grid"><article><b>01</b><h3>“This report is taking my full evening.”</h3><p>You know the work. But writing, checking and making it look good takes too much time.</p></article><article><b>02</b><h3>“I need this PPT to look better.”</h3><p>People expect good work, fast work and new ideas. But no one gives you more time.</p></article><article><b>03</b><h3>“Everyone is talking about AI.”</h3><p>You want to learn. But you do not know what to learn first or how to use it in your job.</p></article></div>
        <div className="ba-callout"><Sparkles/><p>You do not need to become technical. You only need to learn how AI can help you do your work faster.</p></div>
      </section>

      <section className="ba-section ba-dark">
        <p className="ba-kicker">AFTER THIS LIVE WORKSHOP</p><h2>Finish work faster. Still be known for <em>good work.</em></h2>
        <div className="ba-outcomes">{tasks.map(([title, text], i) => <article key={title}><span>0{i + 1}</span><Check/><h3>{title}</h3><p>{text}</p></article>)}</div><CTA>Yes, I want these skills</CTA>
      </section>

      <section className="ba-section ba-work" style={{ background: '#f7f6f2', color: '#151819' }}>
        <div className="ba-section-head"><div><p className="ba-kicker">THIS IS FOR YOU IF...</p><h2>You want to stay ahead at work without becoming <em>technical.</em></h2></div><div className="ba-note">You do not need every AI tool.<br/><b>Learn the right tools before your team does.</b></div></div>
        <div className="ba-audience">{audiences.map((item, i) => <article key={item}><b>0{i + 1}</b><p>{item}</p><ArrowRight/></article>)}</div>
      </section>

      <section className="ba-section ba-why">
        <div className="ba-why-copy"><p className="ba-kicker">WHY THIS MATTERS NOW</p><h2>The person who gets noticed may not work the longest. <em>They may work smarter.</em></h2><p>When you make a clear report, a useful Excel sheet or a good PPT faster, people trust you with bigger work.</p><p>AI will not replace your experience. But a person who uses AI well can finish the same work much faster.</p><CTA>I do not want to be left behind</CTA></div><MediaSlot className="ba-why-media" label="Real work before/after collage" note="Add 3 of your own screenshots: report, Excel sheet, PPT. Hide private details."/>
      </section>

      <section className="ba-section ba-workplace-shift" style={{ background: '#f7f6f2', color: '#151819' }}>
        <p className="ba-kicker">THIS IS ALREADY HAPPENING AT WORK</p><h2>AI is not a future problem.<br/><em>Your workplace is changing now.</em></h2>
        <p className="ba-workplace-lead" style={{ maxWidth: 760, margin: '18px auto 0', fontSize: 18, lineHeight: 1.55 }}>The question is not “Will AI change my work?” The question is: <b>“Will I know how to use it before it becomes normal?”</b></p>
        <div className="ba-data-points"><article style={{ color: '#fff' }}><b>92 MILLION</b><span>jobs may be displaced by 2030</span></article><article style={{ color: '#fff' }}><b>170 MILLION</b><span>new jobs may be created by 2030</span></article><article style={{ color: '#fff' }}><b>40%</b><span>of employers may cut jobs where AI does the task</span></article></div>
        <p className="ba-data-source">Source: <a href="https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/" target="_blank" rel="noreferrer">World Economic Forum, Future of Jobs Report 2025</a>. These are global estimates, not a promise about any one job.</p>
        <p style={{ margin: '32px 0 -28px', color: '#55514a', fontSize: 11, fontWeight: 800, letterSpacing: '.5px' }}>PUBLIC WORKPLACE NEWS · READ THE FACTS BELOW</p>
        <div className="ba-company-shift">
          {companyUpdates.map(([name, logo, fact, copy, source, label]) => <article key={name} style={{ padding: '30px 26px' }}><div className="ba-company-heading" style={{ gap: 16, alignItems: 'center' }}><img src={logo} alt={`${name} logo`} loading="lazy" style={{ width: 100, height: 100, padding: 14 }}/><b style={{ fontSize: 30, color: '#fff' }}>{name}</b></div><strong className="ba-company-fact" style={{ display: 'block', marginTop: 25, color: '#ff7a16', fontSize: 27, lineHeight: 1.05 }}>{fact}</strong><p style={{ minHeight: 0, margin: '14px 0 19px', fontSize: 14 }}>{copy}</p><a href={source} target="_blank" rel="noreferrer">{label} →</a></article>)}
        </div>
        <p className="ba-source-note">Company names are shown only as sourced public-workplace context. They do not endorse, sponsor or partner with Made for More.</p>
        <div className="ba-shift-close"><b>You do not need to panic.</b><span>Learn AI before it becomes a basic expectation in your job.</span><CTA>Start this Sunday</CTA></div>
      </section>

      <section className="ba-section ba-curriculum" style={{ background: '#f7f6f2', color: '#151819' }}><p className="ba-kicker">YOUR LIVE WORKSHOP ROADMAP</p><h2>Three hours to change how you work <em>every day.</em></h2><p className="ba-curriculum-intro" style={{ color: '#4b4944' }}>No long theory. No hard words. Watch it live. Follow the steps. Use it in your own work.</p><div className="ba-tool-row">{toolLogos.map(([name, logo]) => <span key={name} style={{ padding: '13px 16px', fontSize: 13 }}><img src={logo} alt={`${name} logo`} loading="lazy" style={{ width: 42, height: 42 }}/>{name}</span>)}</div><div className="ba-modules">{modules.map(([num, title, text]) => <article key={num}><b>{num}</b><div><h3>{title}</h3><p style={{ color: '#4b4944' }}>{text}</p></div><ArrowRight/></article>)}</div><div className="ba-ai-worker-callout"><b>YES — YOU WILL BUILD YOUR OWN AI WORKER LIVE</b><p>It is not just ChatGPT giving one answer. You will build a worker you can message on Telegram, give repeat work to, and let it work for you in the background.</p></div><CTA>Show me the live roadmap</CTA></section>

      <section className="ba-section ba-contrast"><p className="ba-kicker">GO BEYOND ONE PROMPT AT A TIME</p><h2>Do not only ask AI questions.<br/><em>Make AI work for you.</em></h2><div className="ba-compare"><article><h3>Most people stay here</h3><p>Open ChatGPT only when they are stuck.</p><p>Ask one question. Get one answer.</p><p>Do all repeat work by themselves.</p><p>Know AI is important but have no real system.</p></article><article><h3>What you will learn</h3><p>Use simple AI workflows for daily work.</p><p>Make content and ideas faster.</p><p>Build your own AI worker, step by step.</p><p>Message it on Telegram and give it repeat work to do in the background.</p></article></div><div className="ba-contrast-cta"><b>Do not wait until your team is already ahead.</b><CTA>Join this Sunday’s live batch</CTA></div></section>

      <section className="ba-section ba-work" style={{ background: '#f7f6f2', color: '#151819' }}><div className="ba-section-head"><div><p className="ba-kicker">YOUR JOB IS NOT YOUR ONLY OPTION</p><h2>One useful idea can become your <em>first small business.</em></h2></div><div className="ba-note">No technical background.<br/><b>Just an idea people may find useful.</b></div></div><div className="ba-compare"><article><h3>Before AI</h3><p>“I have an idea, but I cannot build it.”</p><p>“A developer or agency will cost too much.”</p><p>“I do not understand apps, databases or online payments.”</p></article><article><h3>What you will see live</h3><p>Explain your idea clearly to AI.</p><p>Make a simple first app people can open.</p><p>Keep customer details in one place.</p><p>Put it online and add a way for customers to pay.</p></article></div><div className="ba-ai-worker-callout"><b>AI CAN HELP YOU START SMALL</b><p>Build a prototype, test an idea, create a side project, or learn the first steps of an app business. You do not need to become a developer first.</p></div><CTA>Show me how to start</CTA></section>

      <section className="ba-section ba-instructor"><div className="ba-instructor-grid"><MediaSlot src="/images/shanjai-raj-workshop.jpg" className="ba-portrait" label="Shanjai Raj, Made for More workshop instructor"/><div><p className="ba-kicker">A SMALL NOTE FROM SHANJAI</p><h2>I made this workshop because I do not want you to be <em>left behind.</em></h2><div className="ba-letter"><p>Hi, I am Shanjai.</p><p>Every week, companies are changing how people work. AI is doing more work. Teams are becoming smaller. People who know AI are getting more chances.</p><p>This can feel scary. But you do not need to be scared. You need to start.</p><p>I have built products that made seven-figure revenue. One product was later bought by a private equity company. I have also helped large companies use AI to save time and money.</p><p>I have spent more than 1,000 hours using and testing these AI tools. I have selected the best tools and simple steps to help you work faster, do better work, and become very hard to ignore in your job and industry.</p><p>In this live workshop, I will show you these tools and steps. You will learn how to make your daily work faster, make better PPT and Excel work, and build your own AI worker that can do repeat work for you in the background.</p><p>You do not need coding. You do not need to know AI already. Just come live, follow the steps, and start using it in your work.</p><p>If AI is changing work, I want you to be on the winning side of that change.</p><p>See you live,</p><div className="ba-signature">Shanjai Raj</div><small>AI Product Builder · Your workshop mentor</small></div><div className="ba-credentials"><span><ShieldCheck/> Built real products</span><span><ShieldCheck/> Helped companies use AI</span><span><ShieldCheck/> Teaching live, step by step</span></div></div></div></section>

      <section className="ba-section ba-bonuses"><p className="ba-kicker">MORE THAN JUST CHATGPT TIPS</p><h2>Learn the skill that helps you get <em>exactly what you want</em> from AI.</h2><p className="ba-curriculum-intro">AI is useful only when you know what to ask, what tool to use, and what to do with the answer. In this live session, you will learn both parts.</p><div className="ba-bonus-grid"><article><span>LIVE SKILL 01</span><Wand2/><h3>Prompt AI like a professional</h3><p>Give Claude, Gemini, Perplexity or Codex the right instructions. Get useful reports, research, ideas and work — instead of weak answers.</p></article><article><span>LIVE SKILL 02</span><Code2/><h3>Turn one useful idea into an app</h3><p>See the simple path from an idea to a first app people can open and use. You do not need to write code to understand the steps.</p></article><article><span>LIVE SKILL 03</span><Zap/><h3>Make your app ready for real people</h3><p>See how to keep customer details, put your app online, and give customers a simple way to pay. This can become your side project or business.</p></article></div><div className="ba-ai-worker-callout"><b>THIS IS A CHANCE TO BUILD — NOT ONLY WATCH</b><p>Bring one small work problem or app idea. Follow Shanjai live. Start with AI this Sunday instead of waiting for a developer or a technical person.</p></div></section>

      <section id="beahead-enrol" className="ba-section ba-offer"><div className="ba-offer-card"><div><p className="ba-kicker">YOUR LIVE WORKSHOP INVITATION</p><h2>This Sunday, give yourself a stronger way to work from next week.</h2><p>Join Shanjai live. Learn the tools. Follow the steps. Start using AI in your work from Monday.</p><div className="ba-invitation-details"><span><b>DATE</b>Sunday, 9 August 2026</span><span><b>TIME</b>3:00 PM–6:00 PM IST</span><span><b>FORMAT</b>Live online · Simple English</span><span><b>PRICE TODAY</b>₹150 live workshop seat</span></div><div className="ba-includes"><span><Check/> 3-hour live Claude & AI workshop</span><span><Check/> Learn prompting that gets useful results</span><span><Check/> See how to turn an idea into a simple app</span><span><Check/> Made for More workshop certificate</span></div></div><aside><small>One-time workshop access</small><strong>₹150</strong><span>One-time live workshop access</span><CTA>Register for Sunday · ₹150</CTA><p>Secure payment and joining details are the next step.</p></aside></div></section>

      <section className="ba-section ba-faq"><p className="ba-kicker">FREQUENTLY ASKED QUESTIONS</p><h2>Questions are normal.<br/><em>Starting is your choice.</em></h2><div>{faqs.map(([q, a], i) => <article className={open === i ? 'is-open' : ''} key={q}><button onClick={() => setOpen(open === i ? -1 : i)}><span>{q}</span><ChevronDown/></button>{open === i && <p>{a}</p>}</article>)}</div><div className="ba-final-call"><p><b>You do not need to change your whole career this Sunday.</b><br/>You only need to take your first step.</p><CTA>Reserve my ₹150 seat</CTA></div></section>
    </main>
    <footer className="ba-footer"><a href="#top" className="ba-brand">Made <span>for More</span></a><p>Simple AI skills for people who want to stay ahead.</p><a href="/#/build-app-with-ai">View the AI App-Building Workshop →</a><span><a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/refunds.html">Refunds</a></span></footer>
    <div className="ba-mobile-cta"><span><b>₹150</b><small> Live this Sunday</small></span><CTA>Join live workshop</CTA></div>
  </div>;
}
