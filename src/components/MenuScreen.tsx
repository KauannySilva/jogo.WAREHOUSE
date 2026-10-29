'use client';

import CharacterPreview from './CharacterPreview';
import {
  SKIN_COLORS,
  type CharacterConfig,
  type SkinId,
} from '@/game/types';

interface Props {
  config: CharacterConfig;
  setConfig: (config: CharacterConfig) => void;
  onStart: () => void;
}

const skins: { id: SkinId; name: string }[] = [
  { id: 'rose-gold', name: 'Rosa dourado' },
  { id: 'cyber-blue', name: 'Cyber azul' },
  { id: 'desert', name: 'Deserto' },
  { id: 'shadow', name: 'Sombra' },
];

const clothes = ['#263e78', '#733149', '#235744', '#55545e', '#8057a6'];

export default function MenuScreen({
  config,
  setConfig,
  onStart,
}: Props) {
  return (
    <main className="menu-root">
      <section className="preview-panel">
        <div className="brand">
          <span className="eyebrow">TACTICAL ARENA / LOCAL 4V4</span>
          <h1>WAREHOUSE<br /><em>STRIKE</em></h1>
          <p>Três níveis. Dois esquadrões. Uma missão.</p>
        </div>

        <CharacterPreview config={config} />

        <div className="preview-caption">
          {config.playerName || 'Operador'} / SQUAD AZUL
        </div>
      </section>

      <section className="menu-panel">
        <span className="eyebrow">PREPARAÇÃO DO OPERADOR</span>
        <h2>Seu equipamento</h2>

        <label className="field">
          Nome do jogador
          <input
            value={config.playerName}
            maxLength={18}
            placeholder="Seu nome"
            onChange={(event) =>
              setConfig({ ...config, playerName: event.target.value })
            }
          />
        </label>

        <div className="field">
          Skin da arma e detalhes
          <div className="swatches">
            {skins.map((skin) => (
              <button
                key={skin.id}
                type="button"
                title={skin.name}
                aria-label={skin.name}
                aria-pressed={config.skin === skin.id}
                className={`swatch ${config.skin === skin.id ? 'selected' : ''}`}
                style={{ background: SKIN_COLORS[skin.id] }}
                onClick={() => setConfig({ ...config, skin: skin.id })}
              />
            ))}
          </div>
        </div>

        <div className="field">
          Cor do uniforme
          <div className="swatches">
            {clothes.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Uniforme ${color}`}
                aria-pressed={config.clothesColor === color}
                className={`swatch ${config.clothesColor === color ? 'selected' : ''}`}
                style={{ background: color }}
                onClick={() =>
                  setConfig({ ...config, clothesColor: color })
                }
              />
            ))}
          </div>
        </div>

        <label className="field">
          Acessório
          <select
            value={config.accessory}
            onChange={(event) =>
              setConfig({
                ...config,
                accessory: event.target.value as CharacterConfig['accessory'],
              })
            }
          >
            <option value="none">Nenhum</option>
            <option value="helmet">Capacete</option>
            <option value="headset">Headset</option>
            <option value="goggles">Óculos táticos</option>
          </select>
        </label>

        <button className="primary-button" onClick={onStart}>
          INICIAR JOGO →
        </button>

        <div className="controls-card">
          <p>WASD — mover · Mouse — olhar</p>
          <p>Clique esquerdo — atirar · R — recarregar</p>
          <p>Shift — correr · ESC — liberar mouse</p>
          <p>Elevador: entre na plataforma amarela.</p>
        </div>

        <p className="muted">
          Jogo local para computador, com teclado e mouse.
        </p>
      </section>
    </main>
  );
}