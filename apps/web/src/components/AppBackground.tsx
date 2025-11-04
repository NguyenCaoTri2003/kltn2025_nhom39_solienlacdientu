import React, { PropsWithChildren, CSSProperties } from 'react';
import Image from 'next/image';

type AppBackgroundProps = PropsWithChildren<{
  className?: string;
  imageOpacity?: number;
  overlayOpacity?: number; 
  borderRadius?: number; 
  style?: CSSProperties;
}>;

export default function AppBackground({
  children,
  className,
  imageOpacity = 0.45,
  overlayOpacity = 0.18,
  borderRadius = 0,
  style,
}: AppBackgroundProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        backgroundColor: '#ffffff',
        borderRadius,
        overflow: 'hidden',
        maxWidth: '100vw',
        minHeight: '100vh',
        ...style,
      }}
    >
      {/* Top gradient ~1/6 height */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '16.66%',
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(158,219,252,0.8) 0%, rgba(185,230,255,0.4) 50%, rgba(255,255,255,0.9) 100%)',
        }}
      />

      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          transform: 'translateX(-10%)',
          width: '50%',
          aspectRatio: '3 / 2',
          pointerEvents: 'none',
        }}
      >
        <Image
          src="/backgroud.png"
          alt="Background"
          fill
          sizes="70vw"
          style={{
            objectFit: 'contain',
            objectPosition: 'left bottom',
            opacity: imageOpacity,
          }}
          priority
        />
      </div>

      {/* Soft white overlay */}
      {overlayOpacity > 0 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#ffffff',
            opacity: overlayOpacity,
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}


