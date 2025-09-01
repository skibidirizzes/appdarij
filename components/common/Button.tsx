import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

const Button: React.FC<ButtonProps> = ({ children, size = 'md', variant = 'primary', className, ...props }) => {
  const sizeClasses = 
    size === 'lg' ? 'px-8 py-4 text-lg' :
    size === 'sm' ? 'px-3 py-1.5 text-sm' :
    'px-5 py-2.5 text-base';

  const variantClasses =
    variant === 'primary' 
      ? 'text-on-primary bg-primary-500 hover:bg-primary-600 border-2 border-transparent'
    : variant === 'secondary'
      ? 'text-on-primary bg-slate-600 hover:bg-slate-500 border-2 border-transparent'
      : 'bg-transparent border-2 border-primary-500 text-primary-400 hover:bg-primary-900/50';
      
  const disabledClasses = 
    variant === 'primary' || variant === 'secondary'
    ? 'disabled:bg-slate-700 disabled:border-transparent disabled:text-slate-400'
    : 'disabled:bg-transparent disabled:border-slate-700 disabled:text-slate-500'


  return (
    <button
      className={`
        ${sizeClasses}
        ${variantClasses}
        ${disabledClasses}
        font-semibold rounded-lg 
        focus:outline-none focus:ring-4 focus:ring-primary-400/50
        transition-all duration-200 transform hover:scale-105
        disabled:cursor-not-allowed disabled:scale-100 disabled:hover:brightness-100
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
