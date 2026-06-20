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

    /* Progress slider (carousel stub — replace with real data when content is ready) */
    var slides = [
      { icon: 'fa-tree-city',     label: 'Westshore Parks & Recreation expansion' },
      { icon: 'fa-stethoscope',   label: 'New Langford Medical Clinic approved' },
      { icon: 'fa-road',          label: '47km of new trails completed' },
      { icon: 'fa-child-reaching',label: '1,200+ childcare spaces created' },
    ];

    var sliderLabel = document.querySelector('.progress-slider__label');
    var sliderIcon  = document.querySelector('.progress-slider__item i');
    var prevBtn     = document.querySelector('.progress-slider .btn-mini:first-child');
    var nextBtn     = document.querySelector('.progress-slider .btn-mini:last-child');
    var current     = 0;

    function updateSlide() {
      if (!sliderLabel || !sliderIcon) return;
      sliderLabel.textContent = slides[current].label;
      sliderIcon.className = 'fa-solid ' + slides[current].icon;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        current = (current - 1 + slides.length) % slides.length;
        updateSlide();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        current = (current + 1) % slides.length;
        updateSlide();
      });
    }

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
