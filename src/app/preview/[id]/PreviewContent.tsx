'use client'

import { useState } from 'react'
import type { GeneratedContent } from '@/components/LandingPagePreview'
import type { Template } from '@/lib/templates'

const FEATURE_ICONS = ['⚡', '🎯', '🔒', '📊', '🚀', '✨']

interface PreviewContentProps {
  data: GeneratedContent
  productName: string
  template: Template
}

export default function PreviewContent({ data, productName, template }: PreviewContentProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const theme = template.previewTheme

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className={`${theme.heroGradient} px-6 py-20 text-center sm:px-12 sm:py-32`}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {data.headline}
          </h1>
          <p className={`mx-auto mt-4 max-w-xl text-base sm:text-lg ${theme.heroSubtext}`}>
            {data.subheadline}
          </p>
          <div className="mt-8 flex justify-center">
            <button className={`rounded-lg px-8 py-3 text-sm font-semibold shadow-md ${theme.ctaButton}`}>
              {data.cta}
            </button>
          </div>
          <p className={`mt-4 text-xs sm:text-sm ${theme.heroSubtext} opacity-80`}>
            {data.socialProof}
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-black-ink px-6 py-14 sm:px-12 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
            {theme.featuresHeading}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white-muted sm:text-base">
            {theme.featuresSubtext}
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.features.map((feature, i) => (
              <div
                key={i}
                className={`rounded-xl border border-border-subtle bg-black-card p-6 ${theme.featureHover}`}
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-lg ${theme.featureIconBg}`}>
                  {FEATURE_ICONS[i % FEATURE_ICONS.length]}
                </div>
                <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-black-card px-6 py-14 sm:px-12 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-8 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-black-ink shadow-sm">
            {data.faq.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-medium text-white">{item.question}</span>
                  <svg
                    className={`h-4 w-4 flex-shrink-0 text-white-muted transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm leading-relaxed text-white-muted">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${theme.footerBg} px-6 py-10 sm:px-12`}>
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-base font-semibold text-white">{productName}</p>
          <p className="mt-1 text-xs text-white-muted">
            © {new Date().getFullYear()} {productName}. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center gap-6">
            {['Privacy', 'Terms', 'Contact'].map((link) => (
              <span key={link} className="cursor-pointer text-xs text-white-muted transition hover:text-white">
                {link}
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* Attribution */}
      <div className="bg-black-card py-3 text-center text-xs text-white-muted">
        Made with{' '}
        <a
          href="https://brief-sharpener.aiden.services"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-orange-accent"
        >
          AIDEN
        </a>
      </div>
    </div>
  )
}
