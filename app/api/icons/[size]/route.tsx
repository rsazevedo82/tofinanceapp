// app/api/icons/[size]/route.tsx
// Gera ícones PNG para PWA em qualquer tamanho via ImageResponse
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

// Evita limite de 1 MB de Edge Function no plano free da Vercel.
// Mantém o endpoint funcional em runtime Node.js.
export const runtime = 'nodejs'

export async function GET(_req: NextRequest, props: { params: Promise<{ size: string }> }) {
  const params = await props.params;
  const dim = Math.max(16, Math.min(1024, parseInt(params.size) || 192))

  const radius     = Math.round(dim * 0.22)
  const innerSize  = Math.round(dim * 0.62)
  const innerRadius = Math.round(dim * 0.14)
  const fontSize   = Math.round(dim * 0.38)

  return new ImageResponse(
    (
      <div
        style={{
          width: dim,
          height: dim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FF7F50',
          borderRadius: radius,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: innerSize,
            height: innerSize,
            borderRadius: innerRadius,
            background: 'rgba(255,255,255,0.25)',
            border: '2px solid rgba(255,255,255,0.4)',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize,
              fontWeight: 700,
              fontFamily: 'sans-serif',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            N2
          </span>
        </div>
      </div>
    ),
    {
      width: dim,
      height: dim,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': 'image/png',
      },
    }
  )
}
