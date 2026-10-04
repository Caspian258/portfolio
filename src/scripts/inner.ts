/* Inner pages (project detail): menu and per-item colors of the top bar. */
import { initMenu, nativeScroll, prefersReduced } from './ui';
import { initNav } from './nav';

initMenu(nativeScroll);
initNav({ reduce: prefersReduced() });
