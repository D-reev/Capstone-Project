import React from 'react';

export default function TriangleArrow({ down = false, size = 12, className }) {
  const transform = down ? 'rotate(90deg)' : 'rotate(0deg)';
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 10 10"
      style={{ transform, transition: 'transform 120ms ease' }}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <polygon points="2,1 8,5 2,9" />
    </svg>
  );
}
