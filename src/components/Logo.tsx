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
      {/* Temporary logo using emoji until you add your image */}
      <div className="text-royal-blue font-bold text-2xl">
        💙
      </div>
      {/* 
      Once you have your logo image, replace the above with:
      <img 
        src="/logo.png" 
        alt="AzureFlow Logo" 
        className="w-full h-full object-contain"
      />
      */}
    </div>
  );
};

export default Logo;
