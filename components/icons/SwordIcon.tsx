import React from 'react';

export const SwordIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
    <path d="m16 13 6 6" />
    <path d="m20.5 8.5-5 5" />
    <path d="m18 21 3-3" />
    <path d="m3.5 11.5 5 5" />
  </svg>
);