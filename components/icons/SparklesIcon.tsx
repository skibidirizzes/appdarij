import React from 'react';

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9.96 9.96 12 3l2.04 6.96L21 12l-6.96 2.04L12 21l-2.04-6.96L3 12l6.96-2.04z" />
    <path d="M18 6h.01" />
    <path d="M6 18h.01" />
    <path d="M21 15h.01" />
    <path d="M3 9h.01" />
  </svg>
);
