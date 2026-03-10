"use client";

import { useState, useRef, useEffect } from "react";
import { NETWORKS } from "@/lib/constants";

interface NetworkSelectorProps {
  currentChainId: number;
  onSwitch: (chainId: number) => void;
}

const CHAIN_ORDER = [1, 8453, 42161, 10];

/* Tiny inline SVG logos for each chain */
const CHAIN_LOGOS: Record<number, React.ReactNode> = {
  1: (
    <svg width="14" height="14" viewBox="0 0 256 417" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M127.961 0L125.166 9.5V285.168L127.961 287.958L255.923 212.32L127.961 0Z" fill="#343434"/>
      <path d="M127.962 0L0 212.32L127.962 287.958V154.158V0Z" fill="#8C8C8C"/>
      <path d="M127.961 312.187L126.386 314.107V412.306L127.961 416.905L255.999 236.587L127.961 312.187Z" fill="#3C3C3B"/>
      <path d="M127.962 416.905V312.187L0 236.587L127.962 416.905Z" fill="#8C8C8C"/>
      <path d="M127.961 287.958L255.923 212.32L127.961 154.159V287.958Z" fill="#141414"/>
      <path d="M0 212.32L127.962 287.958V154.159L0 212.32Z" fill="#393939"/>
    </svg>
  ),
  8453: (
    <svg width="14" height="14" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
      <path d="M55.5 22C37 22 22 37 22 55.5S37 89 55.5 89 89 74 89 55.5 74 22 55.5 22Zm-9.3 44.6a11 11 0 1 1 0-22h18.6a11 11 0 1 1 0 22H46.2Z" fill="#fff"/>
    </svg>
  ),
  42161: (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="128" cy="128" r="128" fill="#213147"/>
      <path d="M150.4 136.9l20.5 56.8 18.7-10.8-30.3-83.8-8.9 37.8zM107.3 136.9l-8.9-37.8-30.3 83.8 18.7 10.8 20.5-56.8z" fill="#12AAFF"/>
      <path d="M128 60l-29.6 76.9h59.2L128 60z" fill="#fff"/>
    </svg>
  ),
  10: (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="128" cy="128" r="128" fill="#FF0420"/>
      <path d="M93.2 170.7c-23.6 0-38.3-17.9-38.3-44.7 0-26.8 14.7-44.7 38.3-44.7 23.6 0 38.3 17.9 38.3 44.7 0 26.8-14.7 44.7-38.3 44.7zm0-21.5c10.5 0 16-9.5 16-23.2s-5.5-23.2-16-23.2-16 9.5-16 23.2 5.5 23.2 16 23.2zM155.6 83.3h37c18.3 0 30.5 11.8 30.5 30.3v.4c0 18.5-12.5 30.6-31 30.6h-14.3v25.7h-22.2V83.3zm22.2 42h12.8c6.6 0 10.6-4.3 10.6-11v-.3c0-6.8-4-11-10.6-11h-12.8v22.3z" fill="#fff"/>
    </svg>
  ),
};

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
        {CHAIN_LOGOS[currentChainId]} {label} <span className="chevron">&#9662;</span>
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
                {CHAIN_LOGOS[cid]} {net.name}
                {cid === currentChainId && <span className="item-check">&#10003;</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
