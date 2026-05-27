"use client";

import { useEffect, useState } from "react";

interface Props {
  expiredAt: bigint;
}

export function JobCountdown({ expiredAt }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const calc = () => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const diff = expiredAt - now;
      setSecondsLeft(diff > 0n ? Number(diff) : 0);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiredAt]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const d = Math.floor(secondsLeft / 86400);
  const h = Math.floor((secondsLeft % 86400) / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;

  const barColor = secondsLeft > 86400 ? "#1D9E75" : secondsLeft > 3600 ? "#EF9F27" : "#E24B4A";

  if (secondsLeft === 0) {
    return <span style={{ color: "#E24B4A", fontWeight: 500 }}>⏰ Job expired</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", fontFamily: "monospace" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 500 }}>{pad(d)}</div>
          <div style={{ fontSize: 11, color: "#888" }}>days</div>
        </div>
        <span style={{ fontSize: 24, color: "#ccc", marginBottom: 12 }}>:</span>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 500 }}>{pad(h)}</div>
          <div style={{ fontSize: 11, color: "#888" }}>hours</div>
        </div>
        <span style={{ fontSize: 24, color: "#ccc", marginBottom: 12 }}>:</span>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 500 }}>{pad(m)}</div>
          <div style={{ fontSize: 11, color: "#888" }}>mins</div>
        </div>
        <span style={{ fontSize: 24, color: "#ccc", marginBottom: 12 }}>:</span>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 500 }}>{pad(s)}</div>
          <div style={{ fontSize: 11, color: "#888" }}>secs</div>
        </div>
      </div>

      <div style={{ background: "#eee", borderRadius: 4, height: 4 }}>
        <div style={{
          height: 4,
          borderRadius: 4,
          background: barColor,
          width: `${Math.min(100, Math.round((secondsLeft / 86400) * 100))}%`,
          transition: "width 1s linear",
        }} />
      </div>

      <div style={{ fontSize: 12, color: "#888" }}>
        Expires: {new Date(Number(expiredAt) * 1000).toLocaleString("en-US")}
      </div>
    </div>
  );
}