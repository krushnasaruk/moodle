'use client';

import { useEffect, useRef } from 'react';

/**
 * Google AdSense Ad Unit Component
 * 
 * Replace 'ca-pub-XXXXXXXXXXXXXXXX' with your actual AdSense publisher ID.
 * Replace the `slot` prop with the ad slot ID from your AdSense dashboard.
 *
 * Usage:
 *   <AdUnit slot="1234567890" />
 *   <AdUnit slot="1234567890" format="horizontal" />
 *   <AdUnit slot="1234567890" format="rectangle" style={{ marginTop: '20px' }} />
 */

const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX'; // TODO: Replace with your real AdSense publisher ID

export default function AdUnit({ slot, format = 'auto', responsive = true, style = {} }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Only push once per mount, and only if the script is loaded
    if (pushed.current) return;
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      }
    } catch (e) {
      console.error('AdSense push error:', e);
    }
  }, []);

  return (
    <div className="ad-container" style={{ textAlign: 'center', overflow: 'hidden', ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        ref={adRef}
      />
    </div>
  );
}
