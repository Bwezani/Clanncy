'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * ReferralTracker
 * Captures referral code from URL and persists it in localStorage.
 * Respects the one-time usage rule: if a user has already ordered,
 * new referral codes are ignored.
 */
export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    
    // Check if this browser/user has already completed an order
    const isExhausted = localStorage.getItem('referralUsageExhausted');

    if (refCode) {
      if (!isExhausted) {
        localStorage.setItem('activeReferralCode', refCode);
        console.log('Referral code captured globally:', refCode);
      } else {
        console.log('Referral link ignored: user has already placed an order in the past.');
      }
    }
  }, [searchParams]);

  return null;
}
