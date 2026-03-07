import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('enter'); // enter → hold → exit

  useEffect(() => {
    // Phase timeline:
    // 0ms     — mount, start enter animation (800ms)
    // 1800ms  — hold fully visible
    // 2800ms  — start exit animation (600ms)
    // 3400ms  — call onFinish to unmount

    const holdTimer = setTimeout(() => setPhase('exit'), 2800);
    const doneTimer = setTimeout(() => onFinish(), 3400);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-root splash-${phase}`}>
      {/* Animated background layers */}
      <div className="splash-bg">
        <div className="splash-orb splash-orb-1" />
        <div className="splash-orb splash-orb-2" />
        <div className="splash-orb splash-orb-3" />
        <div className="splash-grid" />
      </div>

      {/* Center content */}
      <div className="splash-content">

        {/* App name */}
        <div className="splash-app-name">
          <span className="splash-app-letter">E</span>
          <span className="splash-app-letter">x</span>
          <span className="splash-app-letter">p</span>
          <span className="splash-app-letter">e</span>
          <span className="splash-app-letter">n</span>
          <span className="splash-app-letter">s</span>
          <span className="splash-app-letter">e</span>
          <span className="splash-app-word-break" />
          <span className="splash-app-letter splash-accent">t</span>
          <span className="splash-app-letter splash-accent">i</span>
          <span className="splash-app-letter splash-accent">v</span>
          <span className="splash-app-letter splash-accent">i</span>
          <span className="splash-app-letter splash-accent">t</span>
          <span className="splash-app-letter splash-accent">y</span>
        </div>

        <p className="splash-tagline">Myanmar's Smart Expense Tracker</p>

        {/* Divider */}
        <div className="splash-divider">
          <span className="splash-divider-line" />
          <span className="splash-divider-dot" />
          <span className="splash-divider-line" />
        </div>

        {/* Powered by NaYa */}
        <div className="splash-powered">
          <span className="splash-powered-label">Powered by</span>
          <div className="splash-naya-brand">
            <img
              src="/naya-logo.png"
              alt="NaYa Logo"
              className="splash-naya-logo"
            />
            <div className="splash-naya-text">
              <span className="splash-naya-name">NaYa Group</span>
              <span className="splash-naya-motto">Your Vision, Our Tech</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom loading bar */}
      <div className="splash-loader-wrap">
        <div className="splash-loader-track">
          <div className="splash-loader-bar" />
        </div>
      </div>
    </div>
  );
}
