export interface KeyBindings {
  left: string;
  right: string;
  jump: string;
  action: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  bindings: KeyBindings;
}

export interface HighScore {
  name: string;
  score: number;
  date: string;
}

export type GameState = 'MENU' | 'PLAYING' | 'OPTIONS' | 'LORE' | 'CREDITS' | 'GAME_OVER';

export interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'stump' | 'spirit' | 'rock';
  speed: number;
  passed?: boolean;
}

export interface Collectible {
  x: number;
  y: number;
  size: number;
  type: 'bell' | 'star';
  speed: number;
  collected?: boolean;
  pulse: number;
}
