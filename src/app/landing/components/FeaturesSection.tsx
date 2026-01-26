const features = [
  {
    title: 'Genuine Batteries',
    description:
      '100% original batteries from Osaka, AGS, Exide, Phoenix with manufacturer warranty. No counterfeit products.',
    icon: (
      <svg
        className='h-8 w-8'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
    ),
    stats: '100% Original',
  },
  {
    title: 'Best Market Rates',
    description:
      'Competitive pricing with special discounts for bulk orders and regular customers. Get value for your money.',
    icon: (
      <svg
        className='h-8 w-8'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
        />
      </svg>
    ),
    stats: 'Best Prices',
  },
  {
    title: 'Expert Installation',
    description:
      'Professional battery installation by certified technicians. Free testing and maintenance service included.',
    icon: (
      <svg
        className='h-8 w-8'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
        />
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
        />
      </svg>
    ),
    stats: 'Free Service',
  },
  {
    title: '24/7 Support',
    description:
      'Round-the-clock customer support for all your battery needs. Emergency services available.',
    icon: (
      <svg
        className='h-8 w-8'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
        />
      </svg>
    ),
    stats: 'Always Available',
  },
  {
    title: 'Warranty Coverage',
    description:
      'Comprehensive warranty on all products. Hassle-free replacement and support throughout warranty period.',
    icon: (
      <svg
        className='h-8 w-8'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        />
      </svg>
    ),
    stats: '1-3 Years',
  },
  {
    title: 'Fast Delivery',
    description:
      'Quick delivery across Dera Ghazi Khan. Same-day delivery available for urgent orders within city limits.',
    icon: (
      <svg
        className='h-8 w-8'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0'
        />
      </svg>
    ),
    stats: 'Same Day',
  },
];

export default function FeaturesSection() {
  return (
    <section className='bg-gradient-to-br from-gray-50 to-blue-50 py-20'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='mb-16 text-center'>
          <p className='mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600'>
            Why Choose Us
          </p>
          <h2 className='mb-4 text-4xl font-bold text-gray-900 lg:text-5xl'>
            Trusted Battery Shop in Dera Ghazi Khan
          </h2>
          <p className='mx-auto max-w-3xl text-xl text-gray-600'>
            Your local battery specialist offering genuine products at better
            rates than market. Visit our shop for expert advice, free testing,
            and the best prices on all battery brands.
          </p>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='group relative transform cursor-pointer rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl'
            >
              {/* Gradient Border Effect */}
              <div className='absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>

              {/* Content */}
              <div className='relative z-10'>
                {/* Icon */}
                <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-blue-700 group-hover:text-white group-hover:shadow-lg'>
                  {feature.icon}
                </div>

                {/* Stats Badge */}
                <div className='mb-4 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800'>
                  {feature.stats}
                </div>

                {/* Title */}
                <h3 className='mb-3 text-xl font-bold text-gray-900 transition-colors group-hover:text-white'>
                  {feature.title}
                </h3>

                {/* Description */}
                <p className='leading-relaxed text-gray-600 transition-colors group-hover:text-white'>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className='mt-16 text-center'>
          <div className='inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700'>
            <svg
              className='h-5 w-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 10V3L4 14h7v7l9-11h-7z'
              />
            </svg>
            Get Started Today
          </div>
        </div>
      </div>
    </section>
  );
}
