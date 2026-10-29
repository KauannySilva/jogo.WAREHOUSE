'use client';

import { useEffect, useRef } from 'react';
import { GameEngine } from '@/game/GameEngine';
import type { CharacterConfig, HudState } from '@/game/types';

interface Props {
  config: CharacterConfig;
  onHudChange: (state: HudState) => void;
}

export default function GameCanvas({ config, onHudChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = new GameEngine(container, config, onHudChange);
    engine.start();

    return () => engine.dispose();
  }, [config, onHudChange]);

  return <div className="game-canvas" ref={containerRef} />;
}