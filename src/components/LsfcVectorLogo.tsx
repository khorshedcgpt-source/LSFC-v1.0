import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const LsfcVectorLogo: React.FC<LogoProps> = ({ className = "", size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#902A8B" strokeWidth="6" />
      <circle cx="50" cy="50" r="39" fill="none" stroke="#37A448" strokeWidth="2" strokeDasharray="3 3" />
      {/* Land roof structure */}
      <path d="M50 18 L76 38 L76 74 L24 74 L24 38 Z" fill="#902A8B" opacity="0.1" />
      <path d="M50 22 L72 38 L72 70 L28 70 L28 38 Z" stroke="#902A8B" strokeWidth="3.5" strokeLinejoin="round" fill="none" />
      {/* Cultivated field curves */}
      <path d="M36 52 C42 46, 58 46, 64 52" stroke="#37A448" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 60 C40 54, 60 54, 68 60" stroke="#37A448" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="38" r="5.5" fill="#EC2324" />
      <rect x="40" y="68" width="20" height="4" rx="2" fill="#FFF200" />
    </svg>
  );
};

export const LsfcOfficialSeal: React.FC<LogoProps> = ({ className = "", size = 72 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="60" cy="60" r="56" fill="#FFFFFF" stroke="#902A8B" strokeWidth="4" />
      <circle cx="60" cy="60" r="50" fill="none" stroke="#37A448" strokeWidth="1.5" strokeDasharray="4 2" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="#902A8B" strokeWidth="1.5" />
      {/* Inner emblem */}
      <path d="M60 30 L78 45 L78 78 L42 78 L42 45 Z" stroke="#37A448" strokeWidth="2" fill="#37A448" fillOpacity="0.08" />
      <circle cx="60" cy="46" r="4.5" fill="#EC2324" />
      <path d="M46 62 C52 57, 68 57, 74 62" stroke="#902A8B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 69 C54 65, 66 65, 72 69" stroke="#902A8B" strokeWidth="2" strokeLinecap="round" />
      {/* Curved text approximation / badge text */}
      <text x="60" y="24" textAnchor="middle" fill="#902A8B" fontSize="7" fontWeight="bold" fontFamily="Kalpurush, sans-serif">
        ভূমিসেবা সহায়তা কেন্দ্র
      </text>
      <text x="60" y="98" textAnchor="middle" fill="#37A448" fontSize="7" fontWeight="bold" fontFamily="Kalpurush, sans-serif">
        অনুমোদিত সেবা ডেস্ক
      </text>
    </svg>
  );
};
