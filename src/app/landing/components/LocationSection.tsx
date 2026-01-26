export default function LocationSection() {
  // Your specific coordinates
  const lat = 30.0530291;
  const lng = 70.6485387;

  // Standard Google Maps Embed URL using your coordinates
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <section className='bg-gradient-to-br from-blue-50 to-purple-50 pt-20 '>
      {/* Header Container */}
      <div className='mx-auto mb-12 max-w-7xl px-4 sm:px-6 lg:px-8'>
        <h2 className='mb-3 pt-12 text-center text-4xl font-bold uppercase tracking-tight text-gray-900'>
          Our Location
        </h2>
        <div className='mx-auto h-1 w-20 rounded-full bg-blue-600 '></div>
        <p className='mt-4 text-center text-lg text-gray-500'>
          Visit us at our shop
        </p>
      </div>

      {/* Map - Full Width and 700px Height with no filters */}
      <div className='h-[700px] w-full border-y border-gray-200'>
        <iframe
          src={mapUrl}
          width='100%'
          height='100%'
          style={{ border: 0 }}
          allowFullScreen={true}
          loading='lazy'
          referrerPolicy='no-referrer-when-downgrade'
          title='Google Map'
          className='h-full w-full'
        />
      </div>
    </section>
  );
}
