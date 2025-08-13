import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
        <img 
        src="/ChatGPT Image Aug 5, 2025, 04_33_39 AM.png" 
        alt="AzureFlow Logo" 
        className="w-full h-full object-contain"
      />
      
    </div>
  );
};

export default Logo;
