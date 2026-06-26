;(function () {
  var selector = [
    'main img',
    '.page-section img',
    '.split-section__content img',
    '.blog-card__image img',
    '.blog-post__image img',
    '.section-inner img'
  ].join(',');

  var exclude = '.hero__sub-photo img, .hero__sub-photo-mobile img, .hero__bg';

  function init() {
    if (!('IntersectionObserver' in window)) return;

    document.documentElement.classList.add('js-img-fade');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('img-fade--visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(selector).forEach(function (img) {
      if (img.closest('.hero__sub-photo, .hero__sub-photo-mobile, .site-header__logo, .colby-logo-img') || img.classList.contains('hero__bg')) return;
      img.classList.add('img-fade');
      observer.observe(img);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
