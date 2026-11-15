interface EqualizerIconProps {
  isPlaying: boolean;
  className?: string;
}

export function EqualizerIcon({ isPlaying, className = '' }: EqualizerIconProps) {
  return (
    <span
      className={`inline-flex items-end gap-[2px] h-3.5 w-3.5 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <span
        className={`w-[2.5px] rounded-full bg-[#1ED760] ${
          isPlaying ? 'h-full animate-eq-1' : 'h-[45%] opacity-80'
        }`}
      />
      <span
        className={`w-[2.5px] rounded-full bg-[#1ED760] ${
          isPlaying ? 'h-full animate-eq-2' : 'h-[80%] opacity-80'
        }`}
      />
      <span
        className={`w-[2.5px] rounded-full bg-[#1ED760] ${
          isPlaying ? 'h-full animate-eq-3' : 'h-[55%] opacity-80'
        }`}
      />
      <span
        className={`w-[2.5px] rounded-full bg-[#1ED760] ${
          isPlaying ? 'h-full animate-eq-4' : 'h-[35%] opacity-80'
        }`}
      />
    </span>
  );
}
