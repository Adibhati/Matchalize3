import { useEffect } from 'react';

/**
 * 📱 BROWSER CHROME COLOUR.
 *
 * On a phone the app does not fill the screen. There is a status bar above it
 * and, on iOS, a home-indicator strip below — these belong to the BROWSER, not
 * the page, but the browser paints them using colours the page supplies:
 *
 *   • `<meta name="theme-color">` — Android Chrome, and the iOS home screen
 *     when installed to the dock. Must be a REAL `<meta name="theme-color">`
 *     element; updating it means writing the `content` attribute, since the
 *     value is not reflected and React will not re-render it.
 *   • the root element's background — everything else, including the rubber-band
 *     area you briefly see when overscrolling past the top of the page.
 *
 * iOS deliberately does NOT recolour the top status bar from theme-color in the
 * browser. That is a platform behaviour, not a bug, and it is why
 * `black-translucent` in index.html matters: it lets the page's own background
 * paint under the status bar, which is the only way the top edge can match.
 *
 * WHY THIS IS A HOOK AND NOT A PROP ON A COMPONENT: the colour follows the
 * ACTIVE SCREEN, and the screen is component state in App.jsx — there is no
 * router, so there is no route change to hang an effect on. A hook called
 * once at the shell, keyed on the active tab, is the only place that knows.
 */

/**
 * Set the browser chrome colour and leave it there.
 *
 * @param {string} color CSS colour, e.g. '#131313'
 */
export const setChromeColor = (color) => {
  if (typeof document === 'undefined' || !color) return;

  // Android Chrome + installed-PWA title bar.
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);

  // The overscroll gutter. Setting this on the ROOT — not the body — is what
  // covers the area above and below the page: the body's background propagates
  // to the canvas, but only the root element's covers the rubber-band region.
  document.documentElement.style.backgroundColor = color;
};

/**
 * React binding for {@link setChromeColor}.
 *
 * Also publishes the colour as `--app-bg` so any element can reference it
 * without importing this module.
 *
 * @param {string} color
 */
export const useChromeColor = (color) => {
  useEffect(() => {
    if (!color) return;
    setChromeColor(color);
    document.documentElement.style.setProperty('--app-bg', color);
  }, [color]);
};

export default useChromeColor;