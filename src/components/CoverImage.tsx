import { useState } from 'react';
import { Disc3 } from 'lucide-react';

interface CoverImageProps {
  src: string;
  alt: string;
  accentColor?: string;
  className?: string;
}

export function CoverImage({
  src,
  alt,
  accentColor = '#1ED760',
  className = '',
}: CoverImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-[#1C1B1D] ${className}`}
        style={{
          backgroundImage: `radial-gradient(circle at 30% 25%, ${accentColor}38, transparent 65%), linear-gradient(145deg, #201F22 0%, #0E0E10 100%)`,
        }}
        role="img"
        aria-label={alt}
      >
        <Disc3 className="w-1/3 h-1/3 text-white/40" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
}
