export function selectExperienceMode({ width, coarsePointer, reducedMotion, webglAvailable }) {
  return width > 820 && !coarsePointer && !reducedMotion && webglAvailable ? 'desktop-3d' : 'mobile-2d';
}

export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function getBrowserExperienceMode() {
  return selectExperienceMode({
    width: window.innerWidth,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    webglAvailable: isWebGLAvailable(),
  });
}
