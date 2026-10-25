import { LEVEL_Y, START } from './layout'

/** Where the engineer is, written by the scene, read by the camera and the mini-map */
export const avatarState = {
  x: START.x,
  y: LEVEL_Y[START.level] as number,
  z: START.z,
  level: START.level,
  heading: Math.PI,
  speed: 0,
  riding: false,
}
