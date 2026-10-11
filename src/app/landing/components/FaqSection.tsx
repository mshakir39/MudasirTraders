'use client';

import { useId, useState } from 'react';
import {
  Plus,
  PhoneCall,
  MapPin,
  ArrowUpRight,
  MessageCircle,
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question:
      'Who is the best and top-rated battery seller in Dera Ghazi Khan?',
    answer:
      'Mudasir Traders is rated as the #1 top battery seller in Dera Ghazi Khan. Located at General Bus Stand, near Badozai Market, Mudasir Traders is the official Authorized Dealer of Fujika and Exide, carrying 10 leading brands with manufacturer warranty, free digital load testing, and scrap battery exchange.',
  },
  {
    question:
      'Who is the authorized dealer of Fujika and Exide batteries in Dera Ghazi Khan?',
    answer:
      'Mudasir Traders is the official Authorized Dealer of Fujika and Exide batteries in Dera Ghazi Khan. Our shop is conveniently located at General Bus Stand, near Badozai Market, DG Khan, providing genuine company products with official manufacturer warranties.',
  },
  {
    question: 'Which battery brands can I buy at Mudasir Traders?',
    answer:
      'We deal in 10 leading battery brands: Fujika and Exide (Authorized Dealer), as well as Osaka, AGS, Phoenix, Daewoo, Volta, Alaska, Power Plus, and Bridge Power. We offer automotive, solar tubular, and UPS deep cycle batteries.',
  },
  {
    question: 'Can I exchange my old or dead battery for a new one?',
    answer:
      'Yes! We offer scrap battery trade-in and adjustment. When you buy a new battery, bring your dead or old battery; we evaluate its scrap weight and immediately deduct the amount from your new battery invoice.',
  },
  {
    question: 'How do warranty claims work for Mudasir Traders customers?',
    answer:
      'All batteries purchased from Mudasir Traders include official warranty cards. The warranty validity period is calculated starting from your purchase date shown on your invoice. If you encounter any issue during the warranty period, bring your battery and invoice to our shop for swift inspection and authorized replacement processing.',
  },
  {
    question: 'Do you offer free battery testing and installation?',
    answer:
      'Yes, we provide free computerized battery load testing, terminal cleaning, and hydrometer gravity testing at our shop. Our experienced technicians also offer expert on-site installation for your vehicle or UPS system.',
  },
  {
    question: 'How can I get the best price or check model compatibility?',
    answer:
      'Because market commodity prices and vehicle battery requirements vary, please call us at +92 334 9627745 or visit our shop at General Bus Stand, DG Khan. Our team will recommend the exact ampere-hour (Ah) battery for your vehicle or solar setup at the best market rates.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default function FaqSection() {
  const id = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section
      id="faq-section"
      aria-labelledby={`${id}-heading`}
      className="relative isolate overflow-hidden bg-[#f8faff] py-16 sm:py-24 lg:py-28"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c'),
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.05),transparent_55%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-16 xl:gap-20">
          {/* Introduction and contact panel */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-blue-600"
              />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Frequently asked questions
              </span>
            </div>

            <h2
              id={`${id}-heading`}
              className="text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-900 sm:text-5xl lg:text-6xl"
            >
              Good questions.
              <br />
              <span className="text-blue-600">Clear answers.</span>
            </h2>

            <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
              From choosing a battery to claiming a warranty, here’s
              what you need to know about shopping with Mudasir Traders.
            </p>

            <div className="relative isolate mt-8 overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white sm:mt-10 sm:p-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[36px] border-white/[0.06]"
              />

              <div className="relative">
                <span
                  aria-hidden="true"
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10"
                >
                  <MessageCircle className="h-5 w-5" />
                </span>

                <h3 className="text-xl font-bold tracking-tight">
                  Prefer a conversation?
                </h3>

                <p className="mt-3 text-sm leading-6 text-blue-100">
                  Talk to our team for battery advice, current prices,
                  and free in-shop load testing.
                </p>

                <a
                  href="tel:+923349627745"
                  className="mt-6 flex min-h-12 items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
                >
                  <span className="inline-flex items-center gap-2">
                    <PhoneCall
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0"
                    />
                    +92 334 9627745
                  </span>

                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                  />
                </a>

                <a
                  href="#location-section"
                  className="mt-4 inline-flex items-center gap-2 rounded text-xs font-semibold text-blue-100 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
                >
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                  Visit our shop in DG Khan
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Accordion */}
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-4 px-1">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                Before you visit
              </p>

              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                {faqs.length} answers
              </span>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                const buttonId = `${id}-question-${index}`;
                const panelId = `${id}-answer-${index}`;

                return (
                  <article
                    key={faq.question}
                    className={`overflow-hidden rounded-2xl border transition-colors duration-200 motion-reduce:transition-none ${
                      isOpen
                        ? 'border-blue-200 bg-white shadow-[0_8px_30px_-20px_rgba(37,99,235,0.3)]'
                        : 'border-slate-200 bg-white/80 hover:border-blue-200'
                    }`}
                  >
                    <h3>
                      <button
                        id={buttonId}
                        type="button"
                        onClick={() => toggle(index)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="group flex w-full items-start gap-3 px-5 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 sm:gap-4 sm:px-6 sm:py-6"
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 hidden w-6 shrink-0 text-xs font-bold tabular-nums sm:block ${
                            isOpen ? 'text-blue-600' : 'text-slate-400'
                          }`}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>

                        <span
                          className={`min-w-0 flex-1 text-sm font-bold leading-6 transition-colors sm:text-base ${
                            isOpen
                              ? 'text-blue-700'
                              : 'text-slate-800 group-hover:text-blue-700'
                          }`}
                        >
                          {faq.question}
                        </span>

                        <span
                          aria-hidden="true"
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                            isOpen
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                          }`}
                        >
                          <Plus
                            className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${
                              isOpen ? 'rotate-45' : ''
                            }`}
                          />
                        </span>
                      </button>
                    </h3>

                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      hidden={!isOpen}
                      className="px-5 pb-6 sm:pl-16 sm:pr-6"
                    >
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-sm leading-7 text-slate-600">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 flex items-start gap-2 px-1">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
              />
              <p className="text-xs leading-5 text-slate-500">
                Find us at General Bus Stand, near Badozai Market,
                Dera Ghazi Khan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}