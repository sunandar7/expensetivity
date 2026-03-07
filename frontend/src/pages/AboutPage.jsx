import React, { useEffect, useRef, useState } from 'react';
import './AboutPage.css';

const values = [
  {
    icon: '🔥',
    title: 'တီထွင်ဖန်တီးမှု',
    subtitle: 'Innovation',
    desc: 'ရိုးရိုးနည်းလမ်းများကို စိန်ခေါ်ကာ အသစ်သောဖြေရှင်းနည်းများကို အမြဲရှာဖွေနေသည်။ ဖြစ်မဖြစ်နိုင်ဟု မထင်သောအရာများကို ဖြစ်နိုင်အောင် ဖန်တီးခြင်းသည် ကျွန်ုပ်တို့၏ နေ့စဉ်စိန်ခေါ်မှုဖြစ်သည်။',
    color: '#f5c542',
  },
  {
    icon: '📚',
    title: 'တက်ကြွသောသင်ယူမှု',
    subtitle: 'Active Learning',
    desc: 'နည်းပညာသစ်များကို အမြဲလိုက်လျောညီထွေဖြစ်အောင် သင်ယူနေသောအဖွဲ့တစ်ခုဖြစ်သည်။ မနေ့က မသိသေးသောအရာကို ယနေ့တတ်မြောက်ရန် ကြိုးစားခြင်းသည် ကျွန်ုပ်တို့၏ ဓလေ့ထုံးတမ်းဖြစ်သည်။',
    color: '#2dd4bf',
  },
  {
    icon: '🌱',
    title: 'အတူတကွကြီးထွားမှု',
    subtitle: 'Growing Together',
    desc: 'အဖွဲ့ဝင်တိုင်း၏ ကျွမ်းကျင်မှုနှင့် အောင်မြင်မှုသည် ကျွန်ုပ်တို့အားလုံး၏ အောင်မြင်မှုဖြစ်သည်။ တစ်ဦးချင်းကြီးထွားမှုသည် အဖွဲ့တစ်ခုလုံး၏ ခွန်အားဖြစ်သည်ဟု ကျွန်ုပ်တို့ယုံကြည်သည်။',
    color: '#4ade80',
  },
  {
    icon: '🤝',
    title: 'ယုံကြည်မှုနှင့် ပွင့်လင်းမြင်သာမှု',
    subtitle: 'Trust & Transparency',
    desc: 'သုံးစွဲသူများနှင့် အဖွဲ့ဝင်များအကြား ရိုးသားပွင့်လင်းသောဆက်ဆံရေးကို အာရုံစိုက်သည်။ ယုံကြည်မှုသည် ကျွန်ုပ်တို့တည်ဆောက်သော အုတ်မြစ်ဖြစ်သည်။',
    color: '#a78bfa',
  },
];

const stack = [
  { label: 'React.js', icon: '⚛️' },
  { label: 'Node.js', icon: '🟢' },
  { label: 'Flutter', icon: '💙'},
  { label: 'Next.js', icon: '▲'  },
  { label: 'MongoDB', icon: '🍃' },
  { label: 'Express.js', icon: '🚂' },
  { label: 'Vite', icon: '⚡' },
  { label: 'JavaScript', icon: '📜' },
  { label: 'REST API', icon: '🔌' },
  { label: 'JWT Auth', icon: '🔐' },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Section({ children, className = '' }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={`about-section ${visible ? 'about-section-visible' : ''} ${className}`}>
      {children}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="about-page">

      {/* ── Hero ─────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero-bg">
          <div className="about-orb about-orb-1" />
          <div className="about-orb about-orb-2" />
          <div className="about-hero-grid" />
        </div>
        <div className="about-hero-content animate-fade-in">
          <div className="about-logo-wrap">
            <img src="/naya-logo.png" alt="NaYa Group" className="about-logo" />
          </div>
          <h1 className="about-hero-title">
            <span className="about-hero-naya">NaYa</span> Group
          </h1>
          <p className="about-hero-tagline">Your Vision, Our Tech</p>
          <p className="about-hero-desc">
            A creative, actively learning, and constantly improving software development team emerging from Myanmar.
            {/* မြန်မာနိုင်ငံမှ ပေါ်ထွန်းလာသော တီထွင်ဖန်တီးတတ်သော၊ တက်ကြွစွာသင်ယူနေသော
            နှင့် အမြဲတိုးတက်နေသော ဆော့ဖ်ဝဲလ်ဖွံ့ဖြိုးရေးအဖွဲ့တစ်ခုဖြစ်သည်။ */}
          </p>
          <div className="about-hero-badges">
            <span className="about-badge">🇲🇲 Made in Myanmar</span>
            <span className="about-badge">💻 Software Development</span>
            <span className="about-badge">🚀 Growing Team</span>
          </div>
        </div>
      </section>

      <div className="about-body">

        {/* ── Mission & Vision ─────────────────────── */}
        {/* <Section>
          <div className="mv-grid">
            <div className="mv-card mv-card-mission">
              <div className="mv-icon">🎯</div>
              <h3 className="mv-label">ရည်မှန်းချက်</h3>
              <p className="mv-sublabel">Our Mission</p>
              <p className="mv-text">
                မြန်မာလူငယ်များ၏ နေ့စဉ်ဘဝကို နည်းပညာဖြင့် ပိုမိုလွယ်ကူချောမွေ့စေရန်၊
                အသုံးဝင်သော ဒစ်ဂျစ်တယ်ထုတ်ကုန်များ ဖန်တီးပေးခြင်းဖြစ်သည်။
                သုံးစွဲသူများ၏ ပြဿနာကို နည်းပညာဖြင့် ဖြေရှင်းပေးရန်
                ကျွန်ုပ်တို့ကတိကဝတ်ပြုထားသည်။
              </p>
            </div>
            <div className="mv-card mv-card-vision">
              <div className="mv-icon">🔭</div>
              <h3 className="mv-label">မျှော်မှန်းချက်</h3>
              <p className="mv-sublabel">Our Vision</p>
              <p className="mv-text">
                မြန်မာ့နည်းပညာလောကတွင် ထင်ရှားသောဆော့ဖ်ဝဲလ်ကုမ္ပဏီတစ်ခု
                ဖြစ်လာရန်နှင့် နိုင်ငံတကာအဆင့်မှီ ထုတ်ကုန်များ ဖန်တီးနိုင်ရန်
                ကျွန်ုပ်တို့ဆက်လက်ကြိုးပမ်းနေသည်။
              </p>
            </div>
          </div>
        </Section> */}

        {/* ── About the App ────────────────────────── */}
        <Section>
          <div className="app-about-card">
            <div className="app-about-left">
              <p className="section-eyebrow">ဤ Application အကြောင်း</p>
              <h2 className="section-title">
                Expensetivity<br />
                <span className="section-title-accent">ငွေသုံးစွဲမှု ခြေရာခံစနစ်</span>
              </h2>
              <p className="app-about-text">
                <strong>Expensetivity</strong> သည် NaYa Group မှ ဖန်တီးသော မြန်မာကျပ်ငွေ (MMK)
                အခြေခံသည့် ငွေသုံးစွဲမှုမှတ်တမ်းတင်စနစ်တစ်ခုဖြစ်သည်။
              </p>
              <p className="app-about-text">
                သင်၏ နေ့စဉ်ငွေသုံးစွဲမှုများကို အမျိုးအစားခွဲခြားမှတ်တမ်းတင်ကာ
                မည်သည့်နေရာတွင် မည်မျှသုံးနေသည်ကို ရှင်းရှင်းလင်းလင်း
                မြင်နိုင်အောင် ကူညီပေးသည်။ ငွေကြေးစီမံခန့်ခွဲမှုကို
                ပိုမိုလွယ်ကူစေရန် ဒီ app ကိုဖန်တီးခဲ့သည်။
              </p>
              <div className="app-features">
                {[
                  'ငွေသုံးစွဲမှု မှတ်တမ်းတင်ခြင်း',
                  'အမျိုးအစားခွဲခြားခြင်း',
                  'ဇယားနှင့် ကဒ်မြင်ကွင်း',
                  'ဘောင်ချာ / ငွေတောင်းခံလွှာ တင်ခြင်း',
                  'စာရင်းဇယားနှင့် ဂရပ်ဖ်မြင်ကွင်း',
                  'MMK ငွေကြေးစနစ်',
                ].map((f, i) => (
                  <div key={i} className="app-feature-item">
                    <span className="app-feature-check">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="privacy-box">
                <div className="privacy-box-header">
                    <span className="privacy-icon">🔒</span>
                    <h4 className="privacy-title">ကိုယ်ရေးကိုယ်တာ မူဝါဒ</h4>
                </div>
                <p className="privacy-text">
                    သုံးစွဲသူများ၏ ကိုယ်ရေးကိုယ်တာ အချက်အလက်များကို ကျွန်ုပ်တို့
                    အလွန်တန်ဖိုးထားပါသည်။ သင်၏ ဒေတာများကို ကျွန်ုပ်တို့၏
                    ဝန်ဆောင်မှုပေးရန်အတွက်သာ အသုံးပြုပြီး မည်သည့်
                    ကုမ္ပဏီ၊ အဖွဲ့အစည်း သို့မဟုတ် ပုဂ္ဂိုလ်တစ်ဦးဦးထံသို့မျှ
                    ရောင်းချခြင်း၊ မျှဝေခြင်း မပြုဘဲ လုံးဝကာကွယ်ထားပါသည်။
                </p>
            </div>
            </div>
            <div className="app-about-right">
              <div className="app-mockup">
                <div className="mockup-bar">
                  <span /><span /><span />
                </div>
                <div className="mockup-body">
                  <div className="mockup-stat">
                    <div className="mockup-stat-label">တစ်လစုစုပေါင်း</div>
                    <div className="mockup-stat-val">၁၂၅,၀၀၀ MMK</div>
                  </div>
                  <div className="mockup-bars">
                    {[65, 40, 80, 55, 70, 45].map((h, i) => (
                      <div key={i} className="mockup-bar-item" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="mockup-cats">
                    {['🍜 အစားအသောက်', '💰 စုဆောင်းငွေ', '🛍️ ဈေးဝယ်'].map((c, i) => (
                      <div key={i} className="mockup-cat">{c}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Core Values ──────────────────────────── */}
        {/* <Section>
          <div className="section-header">
            <p className="section-eyebrow">ကျွန်ုပ်တို့ယုံကြည်သောအရာများ</p>
            <h2 className="section-title">တန်ဖိုးများ <span className="section-title-accent">Core Values</span></h2>
          </div>
          <div className="values-grid">
            {values.map((v, i) => (
              <div
                key={i}
                className="value-card"
                style={{ '--value-color': v.color, animationDelay: `${i * 0.1}s` }}
              >
                <div className="value-icon">{v.icon}</div>
                <h4 className="value-title">{v.title}</h4>
                <p className="value-subtitle">{v.subtitle}</p>
                <p className="value-desc">{v.desc}</p>
                <div className="value-accent-line" />
              </div>
            ))}
          </div>
        </Section> */}

        {/* ── Tech Stack ───────────────────────────── */}
        <Section>
          <div className="section-header">
            <p className="section-eyebrow">ကျွန်ုပ်တို့အသုံးပြုသော နည်းပညာများ</p>
            <h2 className="section-title">Tech <span className="section-title-accent">Stack</span></h2>
          </div>
          <div className="stack-grid">
            {stack.map((s, i) => (
              <div key={i} className="stack-chip" style={{ animationDelay: `${i * 0.07}s` }}>
                <span className="stack-chip-icon">{s.icon}</span>
                <span className="stack-chip-label">{s.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Contact ──────────────────────────────── */}
        <Section>
          <div className="contact-card">
            <div className="contact-glow" />
            <img src="/naya-logo.png" alt="NaYa" className="contact-logo" />
            <h2 className="contact-title">ဆက်သွယ်ရန်</h2>
            <p className="contact-subtitle">
              ပူးပေါင်းဆောင်ရွက်လိုပါက သို့မဟုတ် လူကြီးမင်းတို့၏ project အကြောင်း
              တိုင်ပင်လိုပါက ကျွန်ုပ်တို့ထံ ဆက်သွယ်နိုင်ပါသည်။
            </p>
            <div className="contact-links">
              <a href="mailto:nayatech.myanmar@gmail.com" className="contact-link">
                <span className="contact-link-icon">📧</span>
                <span>nayatech.myanmar@gmail.com</span>
              </a>
              <a href="https://www.nayamyanmar.com" target="_blank" rel="noopener noreferrer" className="contact-link">
                <span className="contact-link-icon">🌐</span>
                <span>www.nayamyanmar.com</span>
              </a>
              <a href="https://facebook.com/nayagroup" target="_blank" rel="noopener noreferrer" className="contact-link">
                <span className="contact-link-icon">📘</span>
                <span>NaYa Group</span>
              </a>
            </div>
            <div className="contact-divider" />
            <p className="contact-footer">
              © {new Date().getFullYear()} NaYa Group · Your Vision, Our Tech
            </p>
          </div>
        </Section>

      </div>
    </div>
  );
}
