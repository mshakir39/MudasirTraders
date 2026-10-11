import {
  MapPin,
  Navigation,
  PhoneCall,
  ArrowUpRight,
  BatteryCharging,
} from 'lucide-react';

export default function LocationSection() {
  const address =
    'Mudasir Traders, General Bus Stand, near Badozai Market, Dera Ghazi Khan, 32200, Pakistan';

  const encodedAddress = encodeURIComponent(address);

  const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&z=15&output=embed&hl=en`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

  return (
    <section
      id="location-section"
      aria-labelledby="location-heading"
      className="relative isolate overflow-hidden bg-white py-16 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <header className="mb-10 grid gap-6 lg:mb-12 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-20">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-blue-600"
              />

              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Find our shop
              </span>
            </div>

            <h2
              id="location-heading"
              className="text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-900 sm:text-5xl lg:text-6xl"
            >
              Local expertise.
              <br />
              <span className="text-blue-600">Right here in DG Khan.</span>
            </h2>
          </div>

          <p className="max-w-lg text-base leading-7 text-slate-600 lg:pb-1">
            Visit Mudasir Traders for genuine batteries, expert advice,
            and free in-shop load testing. You’ll find us at General
            Bus Stand, near Badozai Market.
          </p>
        </header>

        {/* Contact panel and map */}
        <div className="grid overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.3)] sm:rounded-[32px] lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="relative isolate flex min-w-0 flex-col overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[40px] border-white/[0.06]"
            />

            <div className="relative">
              <span
                aria-hidden="true"
                className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10"
              >
                <MapPin className="h-7 w-7" strokeWidth={1.5} />
              </span>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
                Your local battery specialist
              </p>

              <h3 className="mt-3 text-3xl font-bold tracking-tight">
                Mudasir Traders
              </h3>

              <address className="mt-5 text-sm not-italic leading-7 text-blue-100">
                General Bus Stand,
                <br />
                near Badozai Market,
                <br />
                Dera Ghazi Khan, 32200, Pakistan
              </address>

              <div className="mt-7 border-t border-white/20 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-200">
                  Call before your visit
                </p>

                <a
                  href="tel:+923349627745"
                  className="mt-3 inline-flex items-center gap-2 rounded text-lg font-bold text-white transition-colors hover:text-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-blue-700"
                >
                  <PhoneCall
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                  />
                  +92 334 9627745
                </a>

                <p className="mt-2 text-xs leading-5 text-blue-100">
                  Ask about current prices and battery availability.
                </p>
              </div>
            </div>

            <div className="relative mt-8 space-y-3 lg:mt-auto lg:pt-8">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get directions to Mudasir Traders on Google Maps, opens in a new tab"
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
              >
                <span className="inline-flex items-center gap-2">
                  <Navigation
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                  Get directions
                </span>

                <ArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4"
                />
              </a>

              <a
                href="tel:+923349627745"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
              >
                <PhoneCall
                  aria-hidden="true"
                  className="h-4 w-4"
                />
                Talk to our team
              </a>
            </div>
          </div>

          {/* Map stays unobstructed */}
          <div className="flex min-w-0 flex-col bg-slate-50">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                <MapPin
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-blue-600"
                />
                General Bus Stand · DG Khan
              </span>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Google Maps in a new tab"
                className="inline-flex shrink-0 items-center gap-1 rounded text-xs font-bold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Open map
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                />
              </a>
            </div>

            <div className="h-[340px] sm:h-[440px] lg:min-h-[520px] lg:flex-1">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Map showing Mudasir Traders in Dera Ghazi Khan"
                className="block h-full w-full"
              />
            </div>
          </div>
        </div>

        {/* Visit information */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4 sm:items-center">
          <BatteryCharging
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 sm:mt-0"
          />

          <p className="text-sm leading-6 text-slate-600">
            <span className="font-bold text-slate-900">
              Not sure which battery you need?
            </span>{' '}
            Bring your vehicle details or existing battery model.
            Our team will help you choose the right fit.
          </p>
        </div>
      </div>
    </section>
  );
}