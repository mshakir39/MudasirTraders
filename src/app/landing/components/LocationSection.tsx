export default function LocationSection() {
  // Your specific coordinates
  const lat = 30.0530291;
  const lng = 70.6485387;
  
  // Standard Google Maps Embed URL using your coordinates
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <section className="pt-20 bg-gradient-to-br from-blue-50 to-purple-50 ">
      {/* Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-4xl font-bold text-center mb-3 text-gray-900 tracking-tight uppercase pt-12">
          Our Location
        </h2>
        <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full "></div>
        <p className="text-center mt-4 text-gray-500 text-lg">
          Visit us at our shop
        </p>
      </div>

      {/* Map - Full Width and 700px Height with no filters */}
      <div className="w-full h-[700px] border-y border-gray-200">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Map"
          className="w-full h-full"
        />
      </div>
    </section>
  );
}