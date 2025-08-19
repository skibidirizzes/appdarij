
import React from 'react';

export const GrammarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        <path d="M4 22h16"></path>
        <path d="M18 2H6v16h12V2z"></path>
        <path d="M12 18V2"></path>
        <path d="M10 6l-2 2 2 2"></path>
        <path d="M14 10l2-2-2-2"></path>
    </svg>
);