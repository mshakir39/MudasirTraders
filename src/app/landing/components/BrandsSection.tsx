'use client';

interface BrandsSectionProps {
  selectedBrand: number;
  setSelectedBrand: (index: number) => void;
}

export default function BrandsSection({
  selectedBrand,
  setSelectedBrand,
}: BrandsSectionProps) {
  const brands = [
    {
      name: 'Osaka',
      logo: '🔋',
      description:
        "Pakistan's most trusted battery brand with 25+ years of excellence",
      features: ['Long Life', 'High Performance', 'Warranty Available'],
    },
    {
      name: 'AGS',
      logo: '🦅',
      description:
        'Japanese technology batteries for superior performance and durability',
      features: ['Japanese Tech', 'Reliable', 'Powerful'],
    },
    {
      name: 'Exide',
      logo: '⚡',
      description:
        'Since 1953, providing premium quality batteries for all vehicles',
      features: ['Since 1953', 'Premium Quality', 'All Vehicles'],
    },
    {
      name: 'Phoenix',
      logo: '🔥',
      description:
        'OEM quality batteries designed for extreme performance conditions',
      features: ['OEM Quality', 'Extreme Performance', 'Durable'],
    },
    {
      name: 'Daewoo',
      logo: '🚗',
      description: 'International standard batteries for automotive excellence',
      features: ['International', 'Auto Excellence', 'Reliable'],
    },
  ];

  return (
    <div className='w-full bg-white'>
      <section className='py-24'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mb-20 text-center'>
            <p className='mb-4 text-sm font-semibold uppercase tracking-widest text-blue-600'>
              Trusted Brands
            </p>
            <h2 className='mb-6 text-4xl font-bold text-gray-900 lg:text-5xl'>
              PREMIUM BATTERY BRANDS
            </h2>
          </div>

          <div className='mb-16 mt-4 flex flex-wrap justify-center gap-4'>
            {brands.map((brand, index) => (
              <button
                key={index}
                onClick={() => setSelectedBrand(index)}
                className={`rounded-full px-6 py-3 font-semibold transition-all duration-200 ${
                  index === selectedBrand
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {brand.logo} {brand.name}
              </button>
            ))}
          </div>

          <div className='relative mx-auto max-w-5xl rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 px-6 py-12 shadow-xl transition-all duration-500 lg:px-16'>
            <div className='relative z-10 text-center'>
              <h3 className='mb-5 text-3xl font-black text-gray-900 lg:text-6xl'>
                {brands[selectedBrand].name}
              </h3>
              <p className='mx-auto mb-8 max-w-3xl text-lg font-medium text-gray-700 lg:text-xl'>
                {brands[selectedBrand].description}
              </p>
              <div className='flex flex-wrap justify-center gap-3'>
                {brands[selectedBrand].features.map((feature, i) => (
                  <span
                    key={i}
                    className='rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow'
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
