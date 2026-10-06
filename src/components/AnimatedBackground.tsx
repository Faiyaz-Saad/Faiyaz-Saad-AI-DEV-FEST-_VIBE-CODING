import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export type BgThemeId = 'aurora' | 'nebula' | 'emerald' | 'sunset';

interface AnimatedBackgroundProps {
  theme: BgThemeId;
}

const THEME_PALETTES: Record<
  BgThemeId,
  {
    baseGradient: string;
    waveColors: [string, string, string, string];
    orbColors: [string, string, string];
    particleColor: string;
  }
> = {
  aurora: {
    baseGradient:
      'linear-gradient(125deg, #04091a 0%, #0d1f4d 28%, #073b4c 58%, #24114a 85%, #050c24 100%)',
    waveColors: [
      'rgba(6, 182, 212, 0.28)',
      'rgba(99, 102, 241, 0.26)',
      'rgba(16, 185, 129, 0.22)',
      'rgba(168, 85, 247, 0.22)',
    ],
    orbColors: ['#06b6d4', '#6366f1', '#10b981'],
    particleColor: 'rgba(103, 232, 249, 0.55)',
  },
  nebula: {
    baseGradient:
      'linear-gradient(125deg, #090418 0%, #2a0f4d 30%, #0f1f5c 62%, #4a0e3a 88%, #0b0620 100%)',
    waveColors: [
      'rgba(217, 70, 239, 0.28)',
      'rgba(99, 102, 241, 0.28)',
      'rgba(56, 189, 248, 0.24)',
      'rgba(244, 63, 94, 0.22)',
    ],
    orbColors: ['#d946ef', '#6366f1', '#38bdf8'],
    particleColor: 'rgba(240, 171, 252, 0.55)',
  },
  emerald: {
    baseGradient:
      'linear-gradient(125deg, #021412 0%, #063831 32%, #0a2846 65%, #113d29 88%, #031819 100%)',
    waveColors: [
      'rgba(16, 185, 129, 0.30)',
      'rgba(6, 182, 212, 0.26)',
      'rgba(52, 211, 153, 0.22)',
      'rgba(59, 130, 246, 0.22)',
    ],
    orbColors: ['#10b981', '#06b6d4', '#34d399'],
    particleColor: 'rgba(110, 231, 183, 0.55)',
  },
  sunset: {
    baseGradient:
      'linear-gradient(125deg, #18071c 0%, #3b102b 30%, #1c164a 62%, #471d0f 88%, #120824 100%)',
    waveColors: [
      'rgba(249, 115, 22, 0.26)',
      'rgba(236, 72, 153, 0.26)',
      'rgba(139, 92, 246, 0.26)',
      'rgba(234, 179, 8, 0.20)',
    ],
    orbColors: ['#f97316', '#ec4899', '#8b5cf6'],
    particleColor: 'rgba(253, 186, 116, 0.55)',
  },
};

export function AnimatedBackground({ theme }: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const palette = THEME_PALETTES[theme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create floating luminous particles
    const particleCount = 38;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      x: ((i * 97) % 100) * (width / 100),
      y: ((i * 53) % 100) * (height / 100),
      radius: 1.5 + (i % 3) * 1.1,
      vx: (i % 2 === 0 ? 1 : -1) * (0.25 + (i % 5) * 0.08),
      vy: -0.2 - (i % 4) * 0.1,
      alphaOffset: i * 0.7,
    }));

    let t = 0;

    const render = () => {
      t += 0.018;
      ctx.clearRect(0, 0, width, height);

      // Draw 4 flowing sinusoidal aurora ribbons across the viewport
      palette.waveColors.forEach((color, idx) => {
        ctx.save();
        ctx.beginPath();

        const baseY = height * (0.22 + idx * 0.19);
        const amplitude = 55 + idx * 18;
        const frequency = 0.0022 + idx * 0.0004;
        const speed = t * (1.1 + idx * 0.25);

        ctx.moveTo(0, height);
        ctx.lineTo(0, baseY);

        for (let x = 0; x <= width; x += 24) {
          const y =
            baseY +
            Math.sin(x * frequency + speed) * amplitude +
            Math.cos(x * frequency * 0.6 - speed * 0.8) * (amplitude * 0.5);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseY - amplitude, 0, height);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(5, 10, 25, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      });

      // Draw subtle connecting constellation lines & glowing particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + p.alphaOffset));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = palette.particleColor;
        ctx.globalAlpha = pulse;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 135) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = palette.particleColor;
            ctx.globalAlpha = (1 - dist / 135) * 0.16;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [palette]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Animated Multi-Stop Base Gradient */}
      <div
        style={{ backgroundImage: palette.baseGradient }}
        className="absolute inset-0 dynamic-bg-pan opacity-95 transition-all duration-700"
      />

      {/* Compositor-Animated Glowing Aurora Orbs */}
      <motion.div
        animate={{
          x: [0, 120, -60, 0],
          y: [0, -70, 60, 0],
          scale: [1, 1.25, 0.9, 1],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{ backgroundColor: palette.orbColors[0] }}
        className="absolute -top-24 -left-20 w-[30rem] h-[30rem] rounded-full opacity-25 blur-[110px]"
      />

      <motion.div
        animate={{
          x: [0, -130, 80, 0],
          y: [0, 90, -60, 0],
          scale: [1, 1.3, 0.95, 1],
        }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
        style={{ backgroundColor: palette.orbColors[1] }}
        className="absolute top-1/4 -right-24 w-[34rem] h-[34rem] rounded-full opacity-25 blur-[120px]"
      />

      <motion.div
        animate={{
          x: [0, 90, -110, 0],
          y: [0, -80, 50, 0],
          scale: [1, 1.2, 1.05, 1],
        }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
        style={{ backgroundColor: palette.orbColors[2] }}
        className="absolute -bottom-28 left-1/4 w-[32rem] h-[32rem] rounded-full opacity-20 blur-[115px]"
      />

      {/* Real-time 60fps Sinusoidal Aurora Wave & Constellation Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
}
