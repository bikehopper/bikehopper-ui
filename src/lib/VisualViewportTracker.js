import Bowser from 'bowser';

// Helper for tracking changes in the visual viewport height, used to detect
// presence of the virtual keyboard in mobile Safari.

let _inited = false;
let _callbacks = [];
let _callbackCount = 0;
let _lastHeight;

export function isSupported() {
  const ua = Bowser.parse(navigator.userAgent);
  return (
    ua.browser.name === 'Safari' &&
    ua.os.name === 'iOS' &&
    !!window.visualViewport
  );
}

export function init() {
  if (_inited) return;
  _inited = true;

  if (!isSupported()) return;

  window.visualViewport.addEventListener('scroll', _handleUpdate);
  window.visualViewport.addEventListener('resize', _handleUpdate);
  _lastHeight = window.visualViewport.height;
}

// Call callback on every update until removed
export function listen(callback) {
  init();
  const id = _callbackCount++;
  _callbacks[id] = callback;
  return id;
}

export function cancel(id) {
  delete _callbacks[id];
}

export function isKeyboardUp() {
  // In case a future version of mobile Safari makes the visual viewport height
  // not exactly window height for some reason, assume that if the visual
  // viewport disagrees with window height by fewer than this many pixels, then
  // the keyboard is down.
  const SLACK = 100;

  return (
    isSupported() && window.innerHeight - window.visualViewport.height >= SLACK
  );
}

// Promise that fulfills when visual viewport is more or less full height, i.e.
// virtual keyboard is down
export function waitForKeyboardDown() {
  return new Promise((resolve, reject) => {
    if (!isKeyboardUp()) {
      // Keyboard is already down, or this is not applicable: Resolve immediately
      resolve();
    } else {
      let id = listen(() => {
        if (!isKeyboardUp()) {
          cancel(id);
          resolve();
        }
      });
    }
  });
}

export function _handleUpdate(evt) {
  const height = window.visualViewport.height;
  if (height === _lastHeight) return;
  _lastHeight = height;

  for (let cb of Object.values(_callbacks)) {
    cb(height);
  }
}
