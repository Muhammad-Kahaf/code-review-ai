import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <div 
      style={{ width: size, height: size }} 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden select-none ${className}`}
    >
      <img 
        src="/logo.svg" 
        alt="CodeReview.AI" 
        className="w-full h-full object-contain drop-shadow-md" 
      />
    </div>
  );
};
