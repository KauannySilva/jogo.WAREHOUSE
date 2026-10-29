'use client';

import { useId, type CSSProperties } from 'react';

interface CombatEffectsProps {
  damageSequence: number;
  kills: number;
}

type ParticleStyle = CSSProperties & {
  '--dx': string;
  '--dy': string;
  '--delay': string;
  '--size': string;
};

function DamageParticles() {
  return (
    <div className="combat-blood-particles">
      {Array.from({ length: 32 }, (_, index) => {
        const side = index % 4;
        const position = 8 + ((index * 29) % 84);
        const travel = 40 + ((index * 17) % 100);
        const drift = ((index * 23) % 100) - 50;

        let left = `${position}%`;
        let top = '1%';
        let dx = drift;
        let dy = travel;

        if (side === 1) {
          left = '99%';
          top = `${position}%`;
          dx = -travel;
          dy = drift;
        }

        if (side === 2) {
          left = `${position}%`;
          top = '99%';
          dx = drift;
          dy = -travel;
        }

        if (side === 3) {
          left = '1%';
          top = `${position}%`;
          dx = travel;
          dy = drift;
        }

        const style: ParticleStyle = {
          left,
          top,
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
          '--delay': `${(index % 5) * 12}ms`,
          '--size': `${3 + (index % 5) * 2}px`,
        };

        return (
          <i
            key={index}
            className="combat-blood-particle"
            style={style}
          />
        );
      })}
    </div>
  );
}

function KillParticles() {
  return (
    <div className="combat-kill-particles">
      {Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        const distance = 45 + (index % 4) * 19;

        const style: ParticleStyle = {
          '--dx': `${Math.cos(angle) * distance}px`,
          '--dy': `${Math.sin(angle) * distance}px`,
          '--delay': `${(index % 3) * 20}ms`,
          '--size': `${2 + (index % 3)}px`,
        };

        return (
          <i
            key={index}
            className="combat-kill-particle"
            style={style}
          />
        );
      })}
    </div>
  );
}

function SkullIcon() {
  return (
    <svg
      className="combat-skull"
      viewBox="0 0 120 140"
      fill="none"
      aria-hidden="true"
    >
      {/* Silhueta principal */}
      <path
        className="combat-skull-shell"
        d="
          M60 8
          C31 8 13 26 13 52
          L17 76
          L29 89
          L30 105
          L42 111
          L44 126
          L76 126
          L78 111
          L90 105
          L91 89
          L103 76
          L107 52
          C107 26 89 8 60 8Z
        "
      />

      {/* Placas da testa */}
      <path
        className="combat-skull-detail"
        d="M25 37L43 24L60 20L77 24L95 37"
      />

      <path
        className="combat-skull-detail"
        d="M60 21L56 37L64 47L59 56"
      />

      {/* Órbitas escuras e angulosas */}
      <path
        className="combat-skull-socket"
        d="M24 53L51 61L47 79L31 76L23 65Z"
      />

      <path
        className="combat-skull-socket"
        d="M96 53L69 61L73 79L89 76L97 65Z"
      />

      {/* Olhos luminosos */}
      <path
        className="combat-skull-eye"
        d="M29 60L45 65L42 72L32 69Z"
      />

      <path
        className="combat-skull-eye"
        d="M91 60L75 65L78 72L88 69Z"
      />

      {/* Cavidade nasal */}
      <path
        className="combat-skull-socket"
        d="M60 77L50 94L60 90L70 94Z"
      />

      {/* Maxilar */}
      <path
        className="combat-skull-detail"
        d="M33 96L44 103H76L87 96"
      />

      <path
        className="combat-skull-teeth"
        d="
          M46 105V120
          M55 105V122
          M65 105V122
          M74 105V120
        "
      />

      {/* Marcas laterais */}
      <path
        className="combat-skull-detail"
        d="M23 82L37 87M97 82L83 87"
      />
    </svg>
  );
}

export default function CombatEffects({
  damageSequence,
  kills,
}: CombatEffectsProps) {
  const id = useId().replace(/:/g, '');
  const roughnessId = `combat-roughness-${id}`;

  return (
    <div className="combat-effects" aria-hidden="true">
      {damageSequence > 0 && (
        <div
          key={`damage-${damageSequence}`}
          className="combat-damage"
        >
          <svg
            className="combat-damage-svg"
            width="100%"
            height="100%"
          >
            <defs>
              <filter
                id={roughnessId}
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
                colorInterpolationFilters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.025 0.055"
                  numOctaves={3}
                  seed={damageSequence % 17}
                  result="noise"
                />

                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale={34}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>

            {/* Não estica a espessura das bordas com o aspect ratio. */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="none"
              stroke="#b80024"
              strokeWidth="100"
              filter={`url(#${roughnessId})`}
            />

            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="none"
              stroke="#ff123d"
              strokeWidth="20"
              opacity="0.85"
              filter={`url(#${roughnessId})`}
            />
          </svg>

          <div className="combat-damage-glow" />

          <DamageParticles />
        </div>
      )}

      {kills > 0 && (
        <div
          key={`kill-${kills}`}
          className="combat-kill"
        >
          <div className="combat-kill-emblem">
            <div className="combat-kill-aura" />

            <KillParticles />

            <SkullIcon />
          </div>

          <div className="combat-kill-info">
            <span className="combat-kill-label">
              ELIMINAÇÃO CONFIRMADA
            </span>

            <span className="combat-kill-count">
              {String(kills).padStart(3, '0')}
            </span>

            <span className="combat-kill-caption">
              ALVO NEUTRALIZADO
            </span>
          </div>
        </div>
      )}
    </div>
  );
}