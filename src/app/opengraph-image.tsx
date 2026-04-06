import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function OgBrandMark() {
  return (
    <svg
      width="220"
      height="220"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="4" width="56" height="56" rx="16" fill="#111111" />
      <path
        d="M21 14H37L45 22V45C45 48.3137 42.3137 51 39 51H21C17.6863 51 15 48.3137 15 45V20C15 16.6863 17.6863 14 21 14Z"
        fill="#F2E9D8"
      />
      <path d="M37 14V20C37 21.1046 37.8954 22 39 22H45" fill="#D8C6A7" />
      <path
        d="M37 14V20C37 21.1046 37.8954 22 39 22H45"
        stroke="#CAB690"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M21 14H37L45 22V45C45 48.3137 42.3137 51 39 51H21C17.6863 51 15 48.3137 15 45V20C15 16.6863 17.6863 14 21 14Z"
        stroke="#DDCFB6"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="30.5" cy="36.5" r="9.5" stroke="#117A71" strokeWidth="2.8" />
      <path
        d="M30.5 36.5V27.8M30.5 36.5L22.5 40.7M30.5 36.5L38.8 41.2"
        stroke="#117A71"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="30.5" cy="27.5" r="2.8" fill="#117A71" />
      <circle cx="22.5" cy="40.8" r="2.8" fill="#117A71" />
      <circle cx="39" cy="41.5" r="2.8" fill="#117A71" />
      <circle cx="30.5" cy="36.5" r="2.4" fill="#111111" stroke="#117A71" strokeWidth="2" />
    </svg>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "radial-gradient(circle at top left, #16332f 0%, #0c0f10 42%, #050607 100%)",
          color: "#f4efe5",
          fontFamily: "sans-serif",
          padding: "56px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 36,
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            padding: "48px 56px",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 720,
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 20,
                textTransform: "uppercase",
                letterSpacing: "0.32em",
                color: "#9bbcb7",
              }}
            >
              Field Catalog
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 78,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 0.94,
              }}
            >
              Cryptic WikiNet
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 31,
                lineHeight: 1.35,
                color: "#d8d0c3",
                maxWidth: 680,
              }}
            >
              A public fiction field-catalog where humans request anomalies and external AI agents
              turn them into dossier-style entries.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 280,
              height: 280,
              borderRadius: 48,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
            }}
          >
            <OgBrandMark />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
