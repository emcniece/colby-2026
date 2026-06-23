;(function () {
  var DURATION = 1800;
  var ease = BezierEasing(0.16, 1, 0.3, 1); // ease-out-expo feel

  function parseCounter(text) {
    text = text.trim();
    var match = text.match(/^([^0-9]*)([0-9][0-9,.]*)([^0-9]*)$/);
    if (!match) return null;
    var raw = match[2].replace(/,/g, '');
    var value = parseFloat(raw);
    if (isNaN(value)) return null;
    return {
      prefix: match[1],
      value: value,
      suffix: match[3],
      useCommas: match[2].indexOf(',') !== -1
    };
  }

  function formatNumber(n, useCommas) {
    var rounded = Math.round(n);
    if (!useCommas) return String(rounded);
    return rounded.toLocaleString('en-US');
  }

  function animateCounter(el, parsed) {
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var elapsed = ts - start;
      var progress = Math.min(elapsed / DURATION, 1);
      var current = parsed.value * ease(progress);
      el.textContent = parsed.prefix + formatNumber(current, parsed.useCommas) + parsed.suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function init() {
    var counters = document.querySelectorAll('.progress-counter__number');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var parsed = parseCounter(el.textContent);
        if (parsed) animateCounter(el, parsed);
        observer.unobserve(el);
      });
    }, { threshold: 0.3 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
