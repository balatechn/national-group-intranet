'use client';

import React, { useState, useEffect } from 'react';

interface CompanyLogoProps {
  width?: number;
  height?: number;
  className?: string;
  fallbackText?: string;
}

export function CompanyLogo({ 
  width = 40, 
  height = 40, 
  className = 'object-contain',
  fallbackText = 'NG'
}: CompanyLogoProps) {
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const response = await fetch('/api/settings/logo');
      if (response.ok) {
        const data = await response.json();
        if (data.logo) {
          setLogo(data.logo);
        }
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div 
        className={`bg-primary rounded-lg flex items-center justify-center text-white font-bold ${className}`}
        style={{ width, height }}
      >
        {fallbackText}
      </div>
    );
  }

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt="Company Logo"
        width={width}
        height={height}
        className={className}
      />
    );
  }

  // Fallback badge
  return (
    <div 
      className={`bg-primary rounded-lg flex items-center justify-center text-white font-bold ${className}`}
      style={{ width, height }}
    >
      {fallbackText}
    </div>
  );
}
