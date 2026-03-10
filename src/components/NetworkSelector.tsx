"use client";

import { useState, useRef, useEffect } from "react";
import { NETWORKS } from "@/lib/constants";

interface NetworkSelectorProps {
  currentChainId: number;
  onSwitch: (chainId: number) => void;
}

const CHAIN_ORDER = [1, 8453, 42161, 10];

export default function NetworkSelector({ currentChainId, onSwitch }: NetworkSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = NETWORKS[currentChainId]?.name ?? "Network";

  return (
    <div className="mini-dropdown" ref={ref}>
      <button className={`mini-dropdown-btn${open ? " open" : ""}`} onClick={() => setOpen(!open)}>
        {label} <span className="chevron">&#9662;</span>
      </button>
      {open && (
        <ul className="mini-dropdown-list">
          {CHAIN_ORDER.map((cid) => {
            const net = NETWORKS[cid];
            if (!net) return null;
            return (
              <li
                key={cid}
                className={`mini-dropdown-item${cid === currentChainId ? " selected" : ""}`}
                onClick={() => { onSwitch(cid); setOpen(false); }}
              >
                {net.name}
                {cid === currentChainId && <span className="item-check">&#10003;</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
