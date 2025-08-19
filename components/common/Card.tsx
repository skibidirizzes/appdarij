

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-2xl shadow-lg backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;