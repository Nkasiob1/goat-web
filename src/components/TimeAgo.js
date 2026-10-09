"use client";                                            // it ticks, so it runs in the browser

import { useEffect, useState } from "react";

export default function TimeAgo({ date }) {              // date is a prop, e.g. "2026-10-09T11:02:00Z"
  const [now, setNow] = useState(null);                  // the current time, unknown until the browser sets it

  useEffect(() => {
    setNow(Date.now());                                  // set the time once the page is in the browser
    const timer = setInterval(() => setNow(Date.now()), 30000); // update every 30 seconds
    return () => clearInterval(timer);                   // stop the timer when leaving the page
  }, []);

  if (!now) return <span>—</span>;                       // nothing to show until the browser knows the time

  const minutes = Math.floor((now - new Date(date)) / 60000); // milliseconds → minutes
  if (minutes < 1) return <span>just now</span>;
  if (minutes < 60) return <span>{minutes}m ago</span>;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return <span>{hours}h ago</span>;
  return <span>{Math.floor(hours / 24)}d ago</span>;
}