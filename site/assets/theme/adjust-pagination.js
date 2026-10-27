;(function() {
  var previous = document.scripts[document.scripts.length - 1].previousElementSibling;

  while(previous && previous.tagName !== 'NAV') {
    previous = previous.previousElementSibling;
  }

  if (!previous) return;

  const lang = document.documentElement.lang || 'en';
  const paginationLabels = {
    en: {
      nav: 'Pagination',
      previous: 'Previous page',
      next: 'Next page',
      page: (text) => `Page ${text}`,
    },
    es: {
      nav: 'Paginación',
      previous: 'Página anterior',
      next: 'Página siguiente',
      page: (text) => `Página ${text}`,
    },
    fr: {
      nav: 'Pagination',
      previous: 'Page précédente',
      next: 'Page suivante',
      page: (text) => `Page ${text}`,
    }
  }

  // Add aria-label to nav
  previous.setAttribute('aria-label', paginationLabels[lang].nav);
  previous.classList.add('pagination-nav');

  previous.firstElementChild.classList.add('d-inline-flex', 'flex-wrap');

  // Get all page items
  var pageItems = previous.querySelectorAll('li.page-item');

  // Process each page item
  pageItems.forEach(function(item) {
    var link = item.querySelector('a.page-link');
    if (!link) return;

    var text = link.textContent.trim();

    // Handle active page (current page)
    if (item.classList.contains('active')) {
      link.setAttribute('aria-current', 'page');
      link.setAttribute('aria-label', paginationLabels[lang].page(text));
    }
    // Handle disabled items
    else if (item.classList.contains('disabled')) {
      if (text === '…') {
        // Ellipsis is decorative
        link.setAttribute('aria-hidden', 'true');
      } else {
        // Disabled prev/next - convert to span and hide from screen readers
        var span = document.createElement('span');
        span.className = link.className;
        span.textContent = link.textContent;
        span.setAttribute('aria-hidden', 'true');
        link.parentNode.replaceChild(span, link);
      }
    }
    // Handle prev/next buttons
    else if (text === '«') {
      link.setAttribute('aria-label', paginationLabels[lang].previous);
    }
    else if (text === '»') {
      link.setAttribute('aria-label', paginationLabels[lang].next);
    }
    // Handle page numbers
    else if (/^\d+$/.test(text)) {
      link.setAttribute('aria-label', paginationLabels[lang].page(text));
    }
  });

  // Original ellipsis cleanup logic
  var disabled = previous.querySelector('ul.pagination > li.disabled:not(:first-child):not(:last-child)');

  if (!disabled) return;

  var parent = disabled.parentElement;
  var p;

  for (var i = 0; i < 5; i++) {
    p = disabled.previousElementSibling;

    if (p && p !== parent) {
      parent.removeChild(p);
    }
  }
})();
