/* Páginas internas (detalle de proyecto): menú y color de la barra. */
import { initMenu, nativeScroll } from './ui';

initMenu(nativeScroll);

const nav = document.querySelector<HTMLElement>('[data-nav]');
const hero = document.querySelector<HTMLElement>('.pp__hero');
if (nav && hero) {
  const update = () => {
    const r = hero.getBoundingClientRect();
    nav.classList.toggle('is-dark', r.bottom > nav.offsetHeight / 2);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}
