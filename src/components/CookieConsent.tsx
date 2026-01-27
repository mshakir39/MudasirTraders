'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('cookie-consent');
    if (!hasConsented) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowConsent(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowConsent(false);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm">
            <span className="font-semibold">Cookie Notice:</span> We use Google Maps for location services, which may use cookies. 
            By continuing to use our site, you agree to our use of cookies for essential functionality.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={declineCookies}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Decline
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => setShowConsent(false)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            aria-label="Close cookie consent"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
