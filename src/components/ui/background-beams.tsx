"use client";

import React from "react";

export const BackgroundBeams = () => {
  const beamStyle = {
    position: 'absolute' as const,
    width: '2px',
    height: '100vh',
    opacity: 0.3,
    animation: 'moveBeam 8s ease-in-out infinite',
  };

  const beams = [
    { left: '10%', delay: '0s', color: 'from-transparent via-blue-500/30 to-transparent' },
    { left: '25%', delay: '2s', color: 'from-transparent via-purple-500/30 to-transparent' },
    { left: '50%', delay: '4s', color: 'from-transparent via-green-500/30 to-transparent' },
    { left: '75%', delay: '6s', color: 'from-transparent via-orange-500/30 to-transparent' },
    { left: '90%', delay: '1s', color: 'from-transparent via-pink-500/30 to-transparent' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Add keyframe animation via style tag */}
      <style>{`
        @keyframes moveBeam {
          0%, 100% {
            transform: translateY(-100vh) rotate(10deg);
            opacity: 0;
          }
          10%, 90% {
            opacity: 0.3;
          }
          50% {
            transform: translateY(50vh) rotate(10deg);
            opacity: 0.6;
          }
        }
      `}</style>
      
      {/* Render animated beams */}
      {beams.map((beam, index) => (
        <div
          key={index}
          className={`bg-gradient-to-b ${beam.color}`}
          style={{
            ...beamStyle,
            left: beam.left,
            animationDelay: beam.delay,
          }}
        />
      ))}
      
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-black/5" />
    </div>
  );
};
