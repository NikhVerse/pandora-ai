import * as React from 'react';

export interface WaveformProps {
  isPlaying: boolean;
  color?: 'purple' | 'pink' | 'blue';
  barCount?: number;
}

export const Waveform: React.FC<WaveformProps> = ({ isPlaying, color = 'pink', barCount = 18 }) => {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  const colors = {
    purple: 'from-neon-purple to-purple-600',
    pink: 'from-neon-pink to-pink-600',
    blue: 'from-neon-blue to-cyan-500',
  };

  return (
    <div className="flex items-center justify-center gap-[4px] h-16 px-4">
      <style>{`
        @keyframes pandoraWave {
          0%, 100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1.0);
          }
        }
        .pandora-bar {
          transform-origin: center;
          animation: pandoraWave 1.2s infinite ease-in-out;
        }
      `}</style>
      {bars.map((bar) => {
        const baseHeight = 12 + Math.sin(bar * 0.5) * 8 + (bar % 2) * 6;
        const delay = `${(bar * 0.08).toFixed(2)}s`;

        return (
          <div
            key={bar}
            style={{
              height: `${baseHeight}px`,
              animationDelay: isPlaying ? delay : undefined,
              animationPlayState: isPlaying ? 'running' : 'paused',
            }}
            className={`w-[4px] rounded-full bg-gradient-to-t ${colors[color]} ${
              isPlaying ? 'pandora-bar' : 'opacity-60 scale-y-75'
            } transition-all duration-300`}
          />
        );
      })}
    </div>
  );
};
