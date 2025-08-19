import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ children, size = 'md', className, ...props }) => {
  const sizeClasses = 
    size === 'lg' ? 'px-8 py-4 text-lg' :
    size === 'sm' ? 'px-3 py-1.5 text-sm' :
    'px-5 py-2.5 text-base';

  return (
    <button
      className={`
        ${sizeClasses}
        font-semibold text-on-primary bg-primary-500 rounded-lg 
        hover:bg-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-400/50
        transition-all duration-200 transform hover:scale-105
        disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;