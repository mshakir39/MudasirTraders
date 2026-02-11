export default function LocationSection() {
  // Your business address
  const address =
    'Mudasir Traders, General Bus Stand, near Badozai Market, Dera Ghazi Khan, 32200, Pakistan';

  // Encode the address for URL
  const encodedAddress = encodeURIComponent(address);

  // Google Maps Embed URL using address
  const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&z=15&output=embed&hl=en`;

  // Direct Google Maps link (opens in new tab)
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <section className='bg-gradient-to-br from-blue-50 to-purple-50 pt-20'>
      {/* Header Container */}
      <div className='mx-auto mb-12 max-w-7xl px-4 sm:px-6 lg:px-8'>
        <h2 className='mb-3 text-center text-4xl font-bold uppercase tracking-tight text-gray-900'>
          Our Location
        </h2>
        <div className='mx-auto h-1 w-20 rounded-full bg-blue-600'></div>
        <p className='mt-4 text-center text-lg text-gray-600'>
          Visit us at our shop in Dera Ghazi Khan
        </p>
      </div>
      {/* Map - Full Width and 700px Height */}
      <div className='h-[700px] w-full border-y border-gray-200 shadow-lg'>
        <iframe
          src={mapUrl}
          width='100%'
          height='100%'
          style={{ border: 0 }}
          allowFullScreen={true}
          loading='lazy'
          referrerPolicy='no-referrer-when-downgrade'
          title='Google Map showing Mudasir Traders location'
          className='h-full w-full'
        />
      </div>
    </section>
  );
}
