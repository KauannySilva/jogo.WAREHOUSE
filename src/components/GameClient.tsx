'use client';

import { useCallback, useState } from 'react';
import MenuScreen from './MenuScreen';
import GameCanvas from './GameCanvas';
import HUD from './HUD';
import {
  INITIAL_HUD,
  type CharacterConfig,
  type HudState,
} from '@/game/types';

export default function GameClient() {
  const [config, setConfig] = useState<CharacterConfig>({
    playerName: 'Operador',
    skin: 'rose-gold',
    clothesColor: '#263e78',
    accessory: 'helmet',
  });

  const [playing, setPlaying] = useState(false);
  const [round, setRound] = useState(0);
  const [hud, setHud] = useState<HudState>({ ...INITIAL_HUD });

  const updateHud = useCallback((state: HudState) => {
    setHud(state);
  }, []);

  function restart() {
    setHud({ ...INITIAL_HUD });
    setRound((value) => value + 1);
  }

  function openMenu() {
    setPlaying(false);
    setHud({ ...INITIAL_HUD });
  }

  if (!playing) {
    return (
      <MenuScreen
        config={config}
        setConfig={setConfig}
        onStart={() => {
          setHud({ ...INITIAL_HUD });
          setPlaying(true);
        }}
      />
    );
  }

  return (
    <main className="game-root">
      <GameCanvas
        key={round}
        config={config}
        onHudChange={updateHud}
      />

      <HUD
        hud={hud}
        playerName={config.playerName}
        onRestart={restart}
        onMenu={openMenu}
      />
    </main>
  );
}