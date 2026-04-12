import { Vibration } from 'react-native';

const PATTERNS = {
  CONTINUOUS: [0, 600, 200],
  SOS:        [100,100,100,100,100,300,300,100,300,100,300,300,100,100,100,800],
  HEARTBEAT:  [0, 180, 80, 180, 900],
  PULSE:      [0, 100, 900],
};

let _vibrating = false;
let _currentPattern = 'CONTINUOUS';
let _escalatingTimers = [];

function clearEscalating() {
  _escalatingTimers.forEach(t => clearTimeout(t));
  _escalatingTimers = [];
}

export function startVibration(patternName = 'CONTINUOUS') {
  stopVibration();
  _vibrating = true;
  _currentPattern = patternName;

  if (patternName === 'ESCALATING') {
    Vibration.vibrate(PATTERNS.HEARTBEAT, true);
    _escalatingTimers.push(setTimeout(() => {
      if (_vibrating) Vibration.vibrate(PATTERNS.CONTINUOUS, true);
    }, 15000));
    _escalatingTimers.push(setTimeout(() => {
      if (_vibrating) Vibration.vibrate(PATTERNS.PULSE, true);
    }, 30000));
    return;
  }

  const pattern = PATTERNS[patternName] || PATTERNS.CONTINUOUS;
  Vibration.vibrate(pattern, true);
}

export function stopVibration() {
  clearEscalating();
  Vibration.cancel();
  _vibrating = false;
}

export function isVibrating() {
  return _vibrating;
}

export function getCurrentPattern() {
  return _currentPattern;
}
