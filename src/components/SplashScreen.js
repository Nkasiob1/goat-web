// src/components/SplashScreen.js
// Animated opening for the INSTALLED app only: coin, radar rings, shine, gold "GOAT", tagline.
// Plays once per session, then fades away.
"use client";

import { useEffect } from "react";

const KEY = "goat-splash-seen";                           // sessionStorage flag: "already played this session"

// All the animation lives in CSS, so it starts the instant the page paints
const CSS = `
.goat-splash{display:none}
@media (display-mode: standalone){html:not(.splash-done) .goat-splash{display:flex}}
.goat-splash{position:fixed;inset:0;z-index:100;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(60% 45% at 50% 42%,#16301f 0%,#0B1210 70%);animation:gs-out .45s ease 2.2s forwards}
.gs-stage{position:relative;width:148px;height:148px;display:grid;place-items:center}
.gs-coin{position:relative;width:148px;height:148px;border-radius:9999px;overflow:hidden;box-shadow:0 0 0 1px rgba(201,162,74,.35),0 0 70px rgba(201,162,74,.35);opacity:0;transform:scale(.6);animation:gs-coin .8s cubic-bezier(.2,.9,.25,1.2) .1s forwards}
.gs-coin img{width:100%;height:100%;display:block}
.gs-shine{position:absolute;inset:-20%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.55) 50%,transparent 60%);transform:translateX(-120%);animation:gs-shine .9s ease-in-out .85s forwards}
.gs-ring{position:absolute;inset:0;border-radius:9999px;border:2px solid rgba(201,162,74,.6);opacity:0;animation:gs-ring 1.6s ease-out .5s forwards}
.gs-ring2{animation-delay:.85s}
.gs-word{position:relative;margin-top:30px;display:flex;gap:.1em;font-size:46px;font-weight:800;letter-spacing:.08em;line-height:1}
.gs-word span{display:inline-block;background:linear-gradient(180deg,#EBCF85,#C9A24A);-webkit-background-clip:text;background-clip:text;color:transparent;opacity:0;transform:translateY(14px);animation:gs-up .5s ease forwards}
.gs-tag{margin-top:12px;color:#8FA199;font-size:12px;letter-spacing:.32em;text-transform:uppercase;opacity:0;animation:gs-fade .6s ease 1.15s forwards}
.gs-bar{margin-top:34px;height:2px;width:0;border-radius:2px;background:linear-gradient(90deg,transparent,#C9A24A,transparent);animation:gs-bar 1.4s ease .6s forwards}
@keyframes gs-coin{to{opacity:1;transform:scale(1)}}
@keyframes gs-shine{to{transform:translateX(120%)}}
@keyframes gs-ring{0%{opacity:.8;transform:scale(1)}100%{opacity:0;transform:scale(2.3)}}
@keyframes gs-up{to{opacity:1;transform:none}}
@keyframes gs-fade{to{opacity:1}}
@keyframes gs-bar{to{width:120px}}
@keyframes gs-out{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion: reduce){.goat-splash *{animation-duration:.01s!important;animation-delay:0s!important}.goat-splash{animation:gs-out .3s ease .8s forwards}}
`;

export default function SplashScreen() {
  useEffect(() => {
    const html = document.documentElement;                // the <html> element
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";         // already played this session?
    } catch {}
    if (seen) {
      html.classList.add("splash-done");                  // yes: hide it straight away
      return;
    }
    const timer = setTimeout(() => {                      // no: let it play (about 2.6s), then...
      try {
        sessionStorage.setItem(KEY, "1");                 // ...remember it played
      } catch {}
      html.classList.add("splash-done");                  // ...and remove it for the rest of the session
    }, 2600);
    return () => clearTimeout(timer);                     // tidy up if the component unmounts early
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="goat-splash" aria-hidden="true">     {/* decorative: screen readers skip it */}
        <div className="gs-stage">
          <span className="gs-ring" />                    {/* radar ripple 1 */}
          <span className="gs-ring gs-ring2" />           {/* radar ripple 2 (a little later) */}
          <div className="gs-coin">
            <img src="/goat-mark.svg" alt="" width="148" height="148" />
            <span className="gs-shine" />                 {/* the light sweep */}
          </div>
        </div>
        <div className="gs-word">
          {"GOAT".split("").map((letter, i) => (
            <span key={i} style={{ animationDelay: `${0.75 + i * 0.08}s` }}>{letter}</span> // letters rise one after another
          ))}
        </div>
        <p className="gs-tag">Greatest Of All Trades</p>
        <span className="gs-bar" />                       {/* thin gold line that grows */}
      </div>
    </>
  );
}