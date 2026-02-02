import '../css/style.css';
import _ from 'lodash';

// Использование lodash (пример: debounce для кнопок/форм при необходимости)
window._ = _;

/**
 * Маска телефона: +7 (XXX) XXX-XX-XX
 */
function applyPhoneMask(input) {
  input.addEventListener('input', (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    let digits = raw;
    if (digits.length > 0 && (digits[0] === '8' || digits[0] === '7')) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);
    let formatted = '+7';
    if (digits.length > 0) {
      formatted += ' (' + digits.slice(0, 3);
      if (digits.length > 3) {
        formatted += ') ' + digits.slice(3, 6);
        if (digits.length > 6) {
          formatted += '-' + digits.slice(6, 8);
          if (digits.length > 8) {
            formatted += '-' + digits.slice(8, 10);
          }
        }
      } else {
        formatted += ')';
      }
    }
    e.target.value = formatted;
  });
}

function initBurgerMenu() {
  const burger = document.getElementById('header-burger');
  const navWrap = document.getElementById('header-nav');
  if (!burger || !navWrap) return;

  function isDesktop() {
    return window.innerWidth >= 1024; // lg в Tailwind — бургер скрыт с 1024px
  }

  function closeMenu() {
    navWrap.classList.remove('nav-open');
    navWrap.style.maxHeight = '';
    burger.setAttribute('aria-expanded', 'false');
    burger.classList.remove('header__burger--open');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    if (isDesktop()) return;
    const isOpen = navWrap.classList.toggle('nav-open');
    navWrap.style.maxHeight = isOpen ? '80vh' : '0';
    burger.setAttribute('aria-expanded', isOpen);
    burger.classList.toggle('header__burger--open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navWrap.querySelectorAll('.header__link, .header__phone').forEach((link) => {
    link.addEventListener('click', () => closeMenu());
  });

  window.addEventListener('resize', () => {
    if (isDesktop()) {
      closeMenu();
      navWrap.style.maxHeight = '';
    }
  });
}

/**
 * Прелоадер: показывается при загрузке, скрывается после DOMContentLoaded
 * с минимальной задержкой, чтобы был виден даже при быстром интернете.
 */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const MIN_DISPLAY_MS = 400;
  const FADE_OUT_MS = 300;

  const start = Date.now();
  const elapsed = () => Date.now() - start;
  const delay = Math.max(0, MIN_DISPLAY_MS - elapsed());

  setTimeout(() => {
    preloader.classList.add('preloader--hidden');
    setTimeout(() => preloader.remove(), FADE_OUT_MS);
  }, delay);
}

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  document.querySelectorAll('input[type="tel"], input[name="phone"]').forEach(applyPhoneMask);
  initBurgerMenu();
});
