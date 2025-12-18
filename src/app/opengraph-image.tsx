import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Afrique Sports - Actualités Football Africain";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #04453f 0%, #065f57 50%, #087a6f 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#9DFF20",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "48px" }}>⚽</span>
          </div>
          <span
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            AFRIQUE SPORTS
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "32px",
            color: "#9DFF20",
            fontWeight: 600,
            marginBottom: "40px",
          }}
        >
          Actualités Football Africain
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: "400px",
            height: "4px",
            background: "linear-gradient(90deg, #09791c, #dbd961, #ff0000)",
            borderRadius: "2px",
            marginBottom: "40px",
          }}
        />

        {/* Topics */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {["CAN 2025", "Mercato", "Résultats", "Classements"].map((topic) => (
            <div
              key={topic}
              style={{
                padding: "12px 24px",
                background: "rgba(255,255,255,0.15)",
                borderRadius: "24px",
                color: "white",
                fontSize: "24px",
                fontWeight: 500,
              }}
            >
              {topic}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
