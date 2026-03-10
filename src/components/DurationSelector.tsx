"use client";

import { useState, useRef, useEffect } from "react";
import { DURATION_OPTIONS } from "@/lib/constants";
import type { YieldDuration } from "@/lib/types";

interface DurationSelectorProps {
  current: YieldDuration;
  onSwitch: (d: YieldDuration) => void;
}

export default function DurationSelector({ current, onSwitch }: DurationSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = DURATION_OPTIONS.find((o) => o.key === current)?.label ?? current;

  return (
    <div className="mini-dropdown" ref={ref}>
      <button className={`mini-dropdown-btn${open ? " open" : ""}`} onClick={() => setOpen(!open)}>
        {label} <span className="chevron">&#9662;</span>
      </button>
      {open && (
        <ul className="mini-dropdown-list">
          {DURATION_OPTIONS.map(({ key, label: l }) => (
            <li
              key={key}
              className={`mini-dropdown-item${key === current ? " selected" : ""}`}
              onClick={() => { onSwitch(key); setOpen(false); }}
            >
              {l}
              {key === current && <span className="item-check">&#10003;</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
