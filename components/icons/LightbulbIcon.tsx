import React from 'react';

export const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 8c0-2.2-1.8-4-4-4-1.2 0-2.3.5-3.1 1.4" />
    <path d="M9 14c-.2-1-.7-1.7-1.5-2.5C6.3 10.2 6 9 6 8c0-2.2 1.8-4 4-4 1.2 0 2.3.5 3.1 1.4" />
    <path d="M12 21a2.5 2.5 0 0 1-2.5-2.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5A2.5 2.5 0 0 1 12 21" />
    <path d="M10 16.5c.5.5 1 .5 1.5 0" />
    <path d="M12.5 16.5c.5.5 1 .5 1.5 0" />
    <line x1="12" y1="4" x2="12" y2="2" />
    <line x1="12" y1="21" x2="12" y2="22" />
    <line x1="4" y1="12" x2="2" y2="12" />
    <line x1="22" y1="12" x2="20" y2="12" />
    <line x1="6" y1="7" x2="4" y2="5" />
    <line x1="18" y1="7" x2="20" y2="5" />
  </svg>
);