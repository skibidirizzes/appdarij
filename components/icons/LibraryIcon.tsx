import React from 'react';

export const LibraryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M4 22h16" />
    <path d="M7 18.5V9" />
    <path d="M12 18.5V9" />
    <path d="M17 18.5V9" />
    <path d="M5 9h14" />
    <path d="M3 9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3Z" />
  </svg>
);