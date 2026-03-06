interface FooterProps {
  statusColor: string;
  statusText: string;
}

export default function Footer({ statusColor, statusText }: FooterProps) {
  return (
    <>
      <div className="footer">
        <div className="footer-inner">
          <div className="footer-bottom">
            <div>
              <div className="footer-sources">
                Sources: Morpho App, Aavescan, DefiLlama &middot; Rates update live when available
              </div>
              <div className="data-status">
                <span className="dot" style={{ background: statusColor }} /> {statusText}
              </div>
            </div>
            <div className="footer-logo">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L4 9v14l12 7 12-7V9L16 2z" fill="#ffffff" opacity={0.1} />
                <path d="M16 2L4 9l12 7 12-7L16 2z" fill="#ffffff" opacity={0.3} />
                <path d="M4 9v14l12 7V16L4 9z" fill="#ffffff" opacity={0.2} />
                <path d="M28 9v14l-12 7V16l12-7z" fill="#ffffff" opacity={0.4} />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          padding: "16px 20px 24px",
          fontSize: "11px",
          color: "#aeaeb2",
          maxWidth: "640px",
          margin: "0 auto",
          lineHeight: 1.5,
        }}
      >
        This website is for informational purposes only and does not constitute financial advice. Always do your own
        research before making any investment decisions.
      </div>
    </>
  );
}
