(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var accordions = document.querySelectorAll('.accordion');

    function wrapAccordionBody(body) {
      if (body.querySelector('.accordion-item__body-inner')) return;

      var inner = document.createElement('div');
      inner.className = 'accordion-item__body-inner';

      while (body.firstChild) {
        inner.appendChild(body.firstChild);
      }

      body.appendChild(inner);
    }

    function closeAccordionItem(item) {
      var btn = item.querySelector('.accordion-item__title');
      var body = btn && document.getElementById(btn.getAttribute('aria-controls'));
      var icon = btn && btn.querySelector('.btn-mini i');

      item.classList.remove('accordion-item--open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (body) body.setAttribute('aria-hidden', 'true');
      if (icon) icon.className = 'fa-solid fa-plus-circle';
    }

    function openAccordionItem(item) {
      var btn = item.querySelector('.accordion-item__title');
      var body = btn && document.getElementById(btn.getAttribute('aria-controls'));
      var icon = btn && btn.querySelector('.btn-mini i');

      item.classList.add('accordion-item--open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      if (body) body.setAttribute('aria-hidden', 'false');
      if (icon) icon.className = 'fa-solid fa-minus-circle';
    }

    accordions.forEach(function (accordion) {
      accordion.querySelectorAll('.accordion-item__body').forEach(function (body) {
        wrapAccordionBody(body);
        body.hidden = false;
        body.removeAttribute('hidden');

        var item = body.closest('.accordion-item');
        body.setAttribute(
          'aria-hidden',
          item.classList.contains('accordion-item--open') ? 'false' : 'true'
        );
      });

      requestAnimationFrame(function () {
        accordion.classList.add('accordion--ready');
      });

      accordion.addEventListener('click', function (e) {
        var btn = e.target.closest('.accordion-item__title');
        if (!btn) return;

        var item = btn.closest('.accordion-item');
        var isOpen = item.classList.contains('accordion-item--open');

        if (isOpen) {
          closeAccordionItem(item);
        } else {
          accordion.querySelectorAll('.accordion-item--open').forEach(closeAccordionItem);
          openAccordionItem(item);
        }
      });
    });

    /* Donation amount selector */
    var amounts = document.querySelectorAll('.donation-amount');
    amounts.forEach(function (btn) {
      btn.addEventListener('click', function () {
        amounts.forEach(function (b) { b.classList.remove('is-selected'); });
        btn.classList.add('is-selected');
      });
    });

    /* Progress slider */
    var progressSlider = document.querySelector('.progress-slider');

    if (progressSlider) {
      var sliderTrack = progressSlider.querySelector('.progress-slider__track');
      var sliderItems = progressSlider.querySelectorAll('.progress-slider__item');
      var sliderPrev = progressSlider.querySelector('.progress-slider__prev');
      var sliderNext = progressSlider.querySelector('.progress-slider__next');
      var sliderCurrent = 0;
      var sliderReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function updateProgressSlider(animate) {
        if (!sliderTrack || !sliderItems.length) return;

        sliderTrack.style.transition = animate && !sliderReducedMotion
          ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          : 'none';
        sliderTrack.style.transform = 'translateX(-' + (sliderCurrent * 100) + '%)';

        sliderItems.forEach(function (item, index) {
          item.setAttribute('aria-hidden', index === sliderCurrent ? 'false' : 'true');
        });
      }

      if (sliderPrev) {
        sliderPrev.addEventListener('click', function () {
          sliderCurrent = (sliderCurrent - 1 + sliderItems.length) % sliderItems.length;
          updateProgressSlider(true);
        });
      }

      if (sliderNext) {
        sliderNext.addEventListener('click', function () {
          sliderCurrent = (sliderCurrent + 1) % sliderItems.length;
          updateProgressSlider(true);
        });
      }

      requestAnimationFrame(function () {
        updateProgressSlider(false);
      });
    }

    /* Priorities survey — sentiment buttons */
    document.querySelectorAll('.survey__sentiment').forEach(function (group) {
      var buttons = group.querySelectorAll('.survey__sentiment-btn');
      var inputs = group.querySelectorAll('.survey__direction-input');

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var inputId = btn.getAttribute('aria-controls');
          var input = inputId && document.getElementById(inputId);

          if (inputs.length) {
            inputs.forEach(function (inp) {
              inp.checked = false;
            });

            if (input) {
              input.checked = true;
            }
          }

          buttons.forEach(function (b) {
            var isActive = b === btn;
            b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            b.classList.toggle('survey__sentiment-btn--active', isActive);
          });

          var form = group.closest('.survey');
          var error = form && form.querySelector('.survey__field-error');
          if (error) {
            error.hidden = true;
          }
        });
      });

      inputs.forEach(function (input) {
        if (!input.checked) return;

        var btn = group.querySelector('[aria-controls="' + input.id + '"]');
        if (btn) {
          btn.setAttribute('aria-pressed', 'true');
          btn.classList.add('survey__sentiment-btn--active');
        }
      });
    });

    /* Mobile nav hamburger */
    var hamburger  = document.querySelector('.btn-hamburger');
    var mobileNav  = document.getElementById('mobile-nav');

    if (hamburger && mobileNav) {
      hamburger.addEventListener('click', function () {
        var isOpen = !mobileNav.hidden;
        mobileNav.hidden = isOpen;
        hamburger.setAttribute('aria-expanded', String(!isOpen));
      });
    }
  });
}());
