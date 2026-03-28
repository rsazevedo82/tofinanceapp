import type { Metadata } from 'next'

export function buildSocialMetadata(params: {
  title: string
  description: string
  imagePath: string
  imageAlt: string
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const { title, description, imagePath, imageAlt } = params

  return {
    openGraph: {
      type: 'website',
      title,
      description,
      images: [
        {
          url: imagePath,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        {
          url: imagePath,
          alt: imageAlt,
        },
      ],
    },
  }
}

