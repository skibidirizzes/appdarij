import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`bg-slate-700 animate-pulse rounded-md ${className}`}
    />
  );
};

export default Skeleton;
