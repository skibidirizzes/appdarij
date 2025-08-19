import React from 'react';

interface RadialProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

const RadialProgress: React.FC<RadialProgressProps> = ({ progress, size = 80, strokeWidth = 8 }) => {
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        height={size}
        width={size}
        className="-rotate-90"
      >
        <circle
          stroke="var(--color-bg-input)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="var(--color-primary-500)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, strokeLinecap: 'round' }}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-[var(--color-text-base)] radial-progress-text">
          {Math.round(normalizedProgress)}%
        </span>
      </div>
    </div>
  );
};

export default RadialProgress;