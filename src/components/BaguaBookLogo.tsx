import React from 'react';

interface BaguaBookLogoProps {
  className?: string;
  size?: number;
}

export const BaguaBookLogo: React.FC<BaguaBookLogoProps> = ({ className = "w-8 h-8", size }) => {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={style}
    >
      {/* Outer Octagon Black BaGua Frame */}
      <polygon
        points="70,10 130,10 190,70 190,130 130,190 70,190 10,130 10,70"
        fill="#121212"
        stroke="#C5A059"
        strokeWidth="3.5"
      />
      <polygon
        points="73,16 127,16 184,73 184,127 127,184 73,184 16,127 16,73"
        fill="none"
        stroke="#2E2A22"
        strokeWidth="1.5"
      />

      {/* 8 Golden/White Trigrams (八卦) Surrounding the Center */}
      {/* Top - Qian ☰ (3 solid lines) */}
      <g stroke="#D4AF37" strokeWidth="3" strokeLinecap="round">
        <line x1="88" y1="22" x2="112" y2="22" />
        <line x1="88" y1="27" x2="112" y2="27" />
        <line x1="88" y1="32" x2="112" y2="32" />
      </g>

      {/* Bottom - Kun ☷ (3 broken lines) */}
      <g stroke="#D4AF37" strokeWidth="3" strokeLinecap="round">
        <line x1="88" y1="168" x2="98" y2="168" /><line x1="102" y1="168" x2="112" y2="168" />
        <line x1="88" y1="173" x2="98" y2="173" /><line x1="102" y1="173" x2="112" y2="173" />
        <line x1="88" y1="178" x2="98" y2="178" /><line x1="102" y1="178" x2="112" y2="178" />
      </g>

      {/* Left - Li ☲ (solid, broken, solid) */}
      <g stroke="#D4AF37" strokeWidth="3" strokeLinecap="round">
        <line x1="22" y1="88" x2="22" y2="112" />
        <line x1="27" y1="88" x2="27" y2="98" /><line x1="27" y1="102" x2="27" y2="112" />
        <line x1="32" y1="88" x2="32" y2="112" />
      </g>

      {/* Right - Kan ☵ (broken, solid, broken) */}
      <g stroke="#D4AF37" strokeWidth="3" strokeLinecap="round">
        <line x1="168" y1="88" x2="168" y2="98" /><line x1="168" y1="102" x2="168" y2="112" />
        <line x1="173" y1="88" x2="173" y2="112" />
        <line x1="178" y1="88" x2="178" y2="98" /><line x1="178" y1="102" x2="178" y2="112" />
      </g>

      {/* Top-Left - Zhen ☳ */}
      <g stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" transform="rotate(-45 50 50)">
        <line x1="40" y1="46" x2="48" y2="46" /><line x1="52" y1="46" x2="60" y2="46" />
        <line x1="40" y1="50" x2="48" y2="50" /><line x1="52" y1="50" x2="60" y2="50" />
        <line x1="40" y1="54" x2="60" y2="54" />
      </g>

      {/* Top-Right - Xun ☴ */}
      <g stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" transform="rotate(45 150 50)">
        <line x1="140" y1="46" x2="160" y2="46" />
        <line x1="140" y1="50" x2="160" y2="50" />
        <line x1="140" y1="54" x2="148" y2="54" /><line x1="152" y1="54" x2="160" y2="54" />
      </g>

      {/* Bottom-Left - Gen ☶ */}
      <g stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" transform="rotate(-135 50 150)">
        <line x1="40" y1="146" x2="60" y2="146" />
        <line x1="40" y1="150" x2="48" y2="150" /><line x1="52" y1="150" x2="60" y2="150" />
        <line x1="40" y1="154" x2="48" y2="154" /><line x1="52" y1="154" x2="60" y2="154" />
      </g>

      {/* Bottom-Right - Dui ☱ */}
      <g stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" transform="rotate(135 150 150)">
        <line x1="140" y1="146" x2="148" y2="146" /><line x1="152" y1="146" x2="160" y2="146" />
        <line x1="140" y1="150" x2="160" y2="150" />
        <line x1="140" y1="154" x2="160" y2="154" />
      </g>

      {/* Central Circle Shield */}
      <circle cx="100" cy="100" r="50" fill="#1C1E1C" stroke="#C5A059" strokeWidth="2" />

      {/* Subtle Yin-Yang Arch in Background of Center */}
      <path d="M100 52 A 24 24 0 0 1 100 100 A 24 24 0 0 0 100 148 A 48 48 0 0 1 100 52 Z" fill="#282C28" opacity="0.6" />

      {/* Central Open Book Symbol */}
      <g transform="translate(0, 4)">
        {/* Left Page */}
        <path
          d="M100 115 C90 106 72 106 60 112 L60 84 C72 78 90 78 100 87 Z"
          fill="#5A6D5B"
        />
        {/* Right Page */}
        <path
          d="M100 115 C110 106 128 106 140 112 L140 84 C128 78 110 78 100 87 Z"
          fill="#708571"
        />
        {/* Spine */}
        <line x1="100" y1="87" x2="100" y2="115" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" />
        {/* Golden Knowledge Star / Spark above book */}
        <path
          d="M100 68 L102 73 L107 75 L102 77 L100 82 L98 77 L93 75 L98 73 Z"
          fill="#D4AF37"
        />
      </g>
    </svg>
  );
};
