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
 * Процесс-бар: при скролле до секции (ПК) скролл заполняет бар.
 * На мобилке: только список прокручивается вбок; при прокрутке списка бар заполняется по позиции.
 */
function initProcessBarScroll() {
  const section = document.getElementById('process-list');
  const barFill = section?.querySelector('[data-process-bar-fill]');
  const listScrollContainer = section?.querySelector('[data-process-list-scroll]');
  if (!section || !barFill) return;

  const SENSITIVITY = 0.0008;
  let progress = 0;
  let isLocked = false;

  const setProgress = (value) => {
    progress = Math.max(0, Math.min(1, value));
    barFill.style.width = progress * 100 + '%';

    // Как только достигли 100% - снимаем блокировку
    if (progress >= 1 && isLocked) {
      unlockPageScroll();
    }
  };

  const isSectionInView = () => {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    return rect.top <= viewportHeight * 0.5 && rect.bottom >= viewportHeight * 0.3;
  };

  const lockPageScroll = () => {
    if (!isLocked) {
      isLocked = true;
      document.documentElement.style.overflowY = 'hidden';
      document.body.style.overflowY = 'hidden';
    }
  };

  const unlockPageScroll = () => {
    if (isLocked) {
      isLocked = false;
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
    }
  };

  // ПК: колёсико заполняет бар
  const onWheel = (e) => {
    const inView = isSectionInView();

    // Если секция видна и бар не заполнен
    if (inView && progress < 1) {
      e.preventDefault();
      e.stopPropagation();
      
      // Блокируем при первом скролле
      if (!isLocked) {
        lockPageScroll();
      }
      
      setProgress(progress + e.deltaY * SENSITIVITY);
    }
  };

  window.addEventListener('wheel', onWheel, { passive: false });

  // Блокируем клавиши скролла пока заблокировано
  const preventKeyScroll = (e) => {
    if (isLocked && progress < 1) {
      const scrollKeys = [32, 33, 34, 35, 36, 38, 40];
      if (scrollKeys.includes(e.keyCode)) {
        e.preventDefault();
      }
    }
  };
  window.addEventListener('keydown', preventKeyScroll, { passive: false });

  // Мобилка: при прокрутке списка вбок бар заполняется по scrollLeft
  if (listScrollContainer) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                     || window.matchMedia('(max-width: 768px)').matches;
    
    if (isMobile) {
      const syncBarFromListScroll = () => {
        const maxScroll = Math.max(0, listScrollContainer.scrollWidth - listScrollContainer.clientWidth);
        if (maxScroll > 0) {
          setProgress(listScrollContainer.scrollLeft / maxScroll);
        }
      };

      listScrollContainer.addEventListener('scroll', syncBarFromListScroll, { passive: true });
      syncBarFromListScroll();
    } else {
      // На десктопе создаём элементы списка
      createProcessList();
    }
  }

  // Создание списка процессов (стили — у родителя .process-list__list в HTML)
  function createProcessList() {
    const list = section.querySelector('[data-info-text]');
    if (!list) return;

    const items = list.getAttribute('data-info-text').split(',').map(s => s.trim());
    list.innerHTML = '';

    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'flex-shrink-0 md:flex-1';
      li.innerHTML = (index + 1) + '. ' + item;
      list.appendChild(li);
    });
  }

  // Очистка
  return () => {
    unlockPageScroll();
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', preventKeyScroll);
  };
}

// Инициализация после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProcessBarScroll);
} else {
  initProcessBarScroll();
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

/**
 * Преимущества: рендер карточек из JSON (script#advantages-data).
 * Каждая карточка: title, text, iconUrl (путь к картинке из инфоблока).
 */
function initAdvantages() {
  const script = document.getElementById('advantages-data');
  const grid = document.querySelector('[data-advantages]');
  if (!script || !grid) return;
  let data;
  try {
    data = JSON.parse(script.textContent);
  } catch (e) {
    return;
  }
  if (!Array.isArray(data)) return;

  data.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'advantages__item p-4 sm:p-5 md:p-6 bg-white rounded-xl text-gray-900 flex flex-col';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'advantages__item-icon w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 mb-3 sm:mb-4 flex items-center justify-center rounded-lg bg-[#2E65CA]/10 text-[#2E65CA] overflow-hidden';

    if (item.iconUrl) {
      const img = document.createElement('img');
      img.src = item.iconUrl;
      img.alt = '';
      img.className = 'w-6 h-6 sm:w-7 sm:h-7 object-contain';
      img.setAttribute('loading', 'lazy');
      iconWrap.appendChild(img);
    }

    const titleEl = document.createElement('h3');
    titleEl.className = 'advantages__item-title text-lg sm:text-xl font-bold mb-2';
    titleEl.textContent = item.title || '';

    const textEl = document.createElement('p');
    textEl.className = 'advantages__item-text text-base sm:text-lg text-gray-900/90 leading-relaxed';
    textEl.textContent = item.text || '';

    article.appendChild(iconWrap);
    article.appendChild(titleEl);
    article.appendChild(textEl);
    grid.appendChild(article);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  document.querySelectorAll('input[type="tel"], input[name="phone"]').forEach(applyPhoneMask);
  initBurgerMenu();
  initProcessBarScroll();
  initAdvantages();
});

document.querySelectorAll('[data-info-text]').forEach((ul) => {
  var text = ul.getAttribute('data-info-text');
  if (!text) return
  var items = text.split(',').map((s) => {return s.trim()})
  items.forEach((itemText, i) => {
    var li = document.createElement('li')
    li.textContent = (i+1) + ".\u00A0" + itemText
    li.classList = "flex-1"
    ul.appendChild(li)
  })
})
