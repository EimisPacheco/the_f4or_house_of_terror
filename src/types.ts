export enum GameState {
  IDLE = 'IDLE',
  LOADING_MODELS = 'LOADING_MODELS',
  GENERATING_GHOST = 'GENERATING_GHOST',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}

export interface GhostState {
  isVisible: boolean;
  position: { x: number; y: number }; // Normalized 0-1
  opacity: number;
  scale: number;
  isFleeing: boolean;
  imageUrl: string | null;
}

export interface Keypoint {
  x: number;
  y: number;
  name?: string;
}

export interface DetectionResult {
  isLookingAtCamera: boolean;
  handPosition: { x: number; y: number } | null; // Normalized 0-1
  faceKeypoints?: Keypoint[];
  handKeypoints?: Keypoint[];
  handPose?: string;
}
export enum GameMode {
  MIRROR = 'MIRROR',
  FLYING_GHOSTS = 'FLYING_GHOSTS',
  BAT_CATCHER = 'BAT_CATCHER',
  POSSESSION = 'POSSESSION'
}

export interface FlyingGhost {
  id: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  angle: number;
  scale: number;
  opacity: number;
}

export interface Bat {
  id: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  scale: number;
  rotation: number;
  rotationSpeed: number;
}

export interface Explosion {
  id: number;
  position: { x: number; y: number };
  timestamp: number;
}
