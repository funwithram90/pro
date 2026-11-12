/** Project a release a short distance ahead, then settle at the nearest useful stop. */
export function swipeDestination(offset: number, velocity: number, width: number) {
  return offset + Math.max(-1800, Math.min(1800, velocity)) * 0.16 < -width / 2 ? -width : 0;
}

export function dismissSheet(offset: number, velocity: number) {
  return offset > 0 && offset + Math.max(-1800, Math.min(1800, velocity)) * 0.16 > 110;
}
