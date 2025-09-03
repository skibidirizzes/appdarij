import React, { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [visible, setVisible] = useState(false);

  const getPositionClasses = () => {
    switch(position) {
        case 'top': return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
        case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-2';
        case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-2';
        case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-2';
        default: return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  }

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`absolute w-max px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-lg z-10 animate-fade-in ${getPositionClasses()}`}>
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;