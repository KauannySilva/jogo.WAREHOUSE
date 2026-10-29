'use client';

import CombatEffects from './CombatEffects';
import type { HudState } from '@/game/types';

interface Props {
  hud: HudState;
  playerName: string;
  onRestart: () => void;
  onMenu: () => void;
}

export default function HUD({
  hud,
  playerName,
  onRestart,
  onMenu,
}: Props) {
  const ended = hud.result !== 'playing';

  const hp = Math.max(
    0,
    Math.min(100, Math.round(hud.hp))
  );

  return (
    <>
      <CombatEffects
        damageSequence={hud.damageSequence}
        kills={hud.kills}
      />

      <div className="hud">
        <section className="health-panel">
          <span className="eyebrow">
            {playerName || 'Operador'}
          </span>

          <div className="health-value">
            {hp}
            <small>% HP</small>
          </div>

          <div
            className="health-track"
            role="progressbar"
            aria-label="Vida do jogador"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={hp}
          >
            <div
              style={{
                width: `${hp}%`,
                background:
                  hp > 30 ? '#4de0a3' : '#ff6475',
              }}
            />
          </div>
        </section>

        <section className="score-panel">
          <span className="blue">
            ALIADOS {hud.blueAlive}
          </span>

          <span>4v4</span>

          <span className="red">
            {hud.redAlive} INIMIGOS
          </span>
        </section>

        {!ended && (
          <div
            className="crosshair"
            aria-hidden="true"
          >
            +
          </div>
        )}

        <section className="ammo-panel">
          <span className="eyebrow">
            {hud.weapon}
          </span>

          <div className="ammo-value">
            {hud.ammo}
            <small> / {hud.reserveAmmo}</small>
          </div>

          <span>
            {hud.reloading
              ? 'RECARREGANDO...'
              : 'R PARA RECARREGAR'}
          </span>

          <p>Eliminações: {hud.kills}</p>
        </section>

        <div className="bottom-help">
          WASD · SHIFT · CLIQUE PARA ATIRAR · ESC
        </div>
      </div>

      {!hud.locked && !ended && (
        <div className="pause-message">
          <h2>Pronto para entrar?</h2>
          <p>Clique no cenário para capturar o mouse.</p>
          <p>ESC libera o cursor e pausa a partida.</p>
        </div>
      )}

      {ended && (
        <div className="result-overlay">
          <div className="result-card">
            <span className="eyebrow">
              OPERAÇÃO ENCERRADA
            </span>

            <h1>
              {hud.result === 'victory'
                ? 'VITÓRIA'
                : 'GAME OVER'}
            </h1>

            <p>
              {hud.result === 'victory'
                ? 'O esquadrão inimigo foi eliminado.'
                : 'Você foi eliminado em combate.'}
            </p>

            <p>
              Suas eliminações: {hud.kills}
            </p>

            <button
              className="primary-button"
              onClick={onRestart}
            >
              REINICIAR PARTIDA
            </button>

            <button
              className="secondary-button"
              onClick={onMenu}
            >
              VOLTAR AO MENU
            </button>
          </div>
        </div>
      )}
    </>
  );
}