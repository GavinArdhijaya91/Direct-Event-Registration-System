"use client";

import { useEffect, useState } from "react";

export default function WibClock() {
  const [time, setTime] = useState("--:--:-- WIB");

  useEffect(() => {
    const update = () => {
      setTime(
        `${new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
          timeZone: "Asia/Jakarta",
        }).format(new Date())} WIB`,
      );
    };
    const initial = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <p
      aria-label={`Jam saat ini ${time}. Jam perangkat hanya indikator visual.`}
      className="mt-4 font-mono text-lg font-semibold tabular-nums"
    >
      {time}
    </p>
  );
}
