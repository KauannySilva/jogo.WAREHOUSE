export type SkinId =
  | 'rose-gold'
  | 'cyber-blue'
  | 'desert'
  | 'shadow';

export interface CharacterConfig {
  playerName: string;
  skin: SkinId;
  clothesColor: string;
  accessory: 'none' | 'helmet' | 'headset' | 'goggles';
}

export interface HudState {
  hp: number;
  ammo: number;
  reserveAmmo: number;
  weapon: string;

  blueAlive: number;
  redAlive: number;
  kills: number;

  locked: boolean;
  reloading: boolean;

  damageSequence: number;

  result: 'playing' | 'victory' | 'defeat';
}

export const INITIAL_HUD: HudState = {
  hp: 100,
  ammo: 30,
  reserveAmmo: 150,
  weapon: 'AR-9 • ROSE GOLD',

  blueAlive: 4,
  redAlive: 4,
  kills: 0,

  locked: false,
  reloading: false,

  damageSequence: 0,

  result: 'playing',
};

export const SKIN_COLORS: Record<SkinId, string> = {
  'rose-gold': '#ff85b3',
  'cyber-blue': '#46cfff',
  desert: '#d1ac73',
  shadow: '#36394b',
};