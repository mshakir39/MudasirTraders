'use client';

interface BrandsSectionProps {
  selectedBrand: number;
  setSelectedBrand: (index: number) => void;
}

export default function BrandsSection({ selectedBrand, setSelectedBrand }: BrandsSectionProps) {
  const brands = [
    { 
      name: "Osaka", logo: "🔋",
      description: "Pakistan's most trusted battery brand with 25+ years of excellence",
      features: ["Long Life", "High Performance", "Warranty Available"]
    },
    { 
      name: "AGS", logo: "🦅",
      description: "Japanese technology batteries for superior performance and durability",
      features: ["Japanese Tech", "Reliable", "Powerful"]
    },
    { 
      name: "Exide", logo: "⚡",
      description: "Since 1953, providing premium quality batteries for all vehicles",
      features: ["Since 1953", "Premium Quality", "All Vehicles"]
    },
    { 
      name: "Phoenix", logo: "🔥",
      description: "OEM quality batteries designed for extreme performance conditions",
      features: ["OEM Quality", "Extreme Performance", "Durable"]
    },
    { 
      name: "Daewoo", logo: "🚗",
      description: "International standard batteries for automotive excellence",
      features: ["International", "Auto Excellence", "Reliable"]
    }
  ];

  return (
    <div className="bg-white w-full">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-4">Trusted Brands</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">PREMIUM BATTERY BRANDS</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-16 mt-4">
            {brands.map((brand, index) => (
              <button
                key={index}
                onClick={() => setSelectedBrand(index)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                  index === selectedBrand 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {brand.logo} {brand.name}
              </button>
            ))}
          </div>

          <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl px-6 py-12 lg:px-16 max-w-5xl mx-auto transition-all duration-500">
            <div className="relative z-10 text-center">
              <h3 className="text-3xl lg:text-6xl font-black mb-5 text-gray-900">
                {brands[selectedBrand].name}
              </h3>
              <p className="text-lg lg:text-xl font-medium text-gray-700 mb-8 max-w-3xl mx-auto">
                {brands[selectedBrand].description}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {brands[selectedBrand].features.map((feature, i) => (
                  <span key={i} className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 shadow">
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