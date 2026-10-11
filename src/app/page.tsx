'use client';

import { useState } from 'react';
import Navigation from './landing/components/Navigation';
import FeaturesSection from './landing/components/FeaturesSection';
import Footer from './landing/components/Footer';
import BrandsSection from './landing/components/BrandsSection';
import LocationSection from './landing/components/LocationSection';
import MeetupSection from './landing/components/MeetupSection';
import HeroSlider from './landing/components/HeroSlider';
import CustomerReviews from './landing/components/CustomerReviews';
import FaqSection from './landing/components/FaqSection';

export default function Home() {
  // Shared state for the selected brand
  const [selectedBrand, setSelectedBrand] = useState(0);

  // Function to handle brand selection + smooth scroll
  const handleBrandSelection = (index: number) => {
    setSelectedBrand(index);
    const element = document.getElementById('brands-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const slides = [
    {
      id: 1,
      image:
        'https://res.cloudinary.com/divdl3sad/image/upload/v1769437584/Gemini_Generated_Image_oz2asxoz2asxoz2a_hzeyaj.png',
      title: 'Quality Batteries',
      subtitle: 'Trusted Power Solutions for Dera Ghazi Khan',
      description:
        'Your local battery specialist offering genuine products at competitive prices. Visit our shop at General Bus Stand for expert advice and the best deals.',
    },
    {
      id: 2,
      image:
        'https://res.cloudinary.com/divdl3sad/image/upload/v1769437289/Gemini_Generated_Image_djh63edjh63edjh6_gntnqv.png',
      title: 'Authorized Dealership',
      subtitle: 'Authorized Dealer of Fujika & Exide',
      description:
        'Official authorized dealer for Fujika and Exide. We also carry genuine Osaka, AGS, Phoenix, Daewoo, Volta, Alaska, Power Plus & Bridge Power with official manufacturer warranty.',
    },
    {
      id: 3,
      image:
        'https://res.cloudinary.com/divdl3sad/image/upload/v1769434960/some-electronic-parts-process-repairing-car-after-accident-man-working-with-engine-hood_pdnr2v.jpg',
      title: 'Expert Service',
      subtitle: 'Free Testing & Installation',
      description:
        'Professional battery testing, installation, and maintenance services. Our experienced team ensures you get the right battery for your needs.',
    },
  ];

  return (
    <main className='min-h-screen'>
      <header>
        <Navigation />
      </header>

      <section
        id='hero-section'
        className='relative h-screen'
        aria-label='Hero Section'
      >
        <HeroSlider slides={slides} />
      </section>

      <section id='features-section' aria-label='Features Section'>
        <FeaturesSection />
      </section>

      {/* We wrap BrandsSection in a div with an ID so we can scroll to it.
          We pass the state and the setter to it.
      */}
      <section id='brands-section' aria-label='Products Section'>
        <BrandsSection
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
        />
      </section>

      <CustomerReviews />

      <MeetupSection />

      <FaqSection />

      <LocationSection />

      {/* We pass the special click handler to the footer */}
      <footer id='footer-section'>
        <Footer onBrandClick={handleBrandSelection} />
      </footer>
    </main>
  );
}
