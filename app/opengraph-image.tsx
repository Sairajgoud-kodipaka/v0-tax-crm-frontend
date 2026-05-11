import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Taxfiley – Smart Tax Filing & Client Portal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 96,
            height: 96,
            borderRadius: 24,
            background: '#3b82f6',
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 800, color: '#fff' }}>T</span>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-2px',
            marginBottom: 16,
          }}
        >
          Taxfiley
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          Smart Tax Filing &amp; Client Portal
        </div>

        {/* Bottom strip */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#64748b',
            fontSize: 20,
          }}
        >
          <span>www.taxfiley.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
