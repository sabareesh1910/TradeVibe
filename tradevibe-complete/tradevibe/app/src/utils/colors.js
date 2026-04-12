export const C = {
  BG:           '#0a0a0f',
  SURFACE:      '#0d0d1a',
  SURFACE2:     '#111126',
  BORDER:       '#1a1a2e',
  BORDER2:      '#252540',

  GREEN:        '#00ff88',
  GREEN_DIM:    '#003322',
  GREEN_BORDER: '#005533',

  RED:          '#ff4444',
  RED_DIM:      '#330011',
  RED_BORDER:   '#550022',

  AMBER:        '#ffaa00',
  AMBER_DIM:    '#1a1000',
  AMBER_BORDER: '#332200',

  BLUE:         '#4488ff',
  BLUE_DIM:     '#0a1a33',

  WHITE:        '#ffffff',
  GRAY1:        '#aaaaaa',
  GRAY2:        '#666666',
  GRAY3:        '#444444',
  GRAY4:        '#222233',
};

export function actionColor(action) {
  if (action === 'BUY')  return C.GREEN;
  if (action === 'SELL') return C.RED;
  return C.AMBER;
}

export function actionDim(action) {
  if (action === 'BUY')  return C.GREEN_DIM;
  if (action === 'SELL') return C.RED_DIM;
  return C.AMBER_DIM;
}

export function actionBorder(action) {
  if (action === 'BUY')  return C.GREEN_BORDER;
  if (action === 'SELL') return C.RED_BORDER;
  return C.AMBER_BORDER;
}

export function statusColor(status) {
  if (status === 'connected' || status === 'active' || status === 'registered' || status === 'live') return C.GREEN;
  if (status === 'idle' || status === 'waiting')  return C.AMBER;
  return C.RED;
}
