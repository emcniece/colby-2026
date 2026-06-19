;(function() {
  document.querySelectorAll('.activity-content').forEach(function(el) {
    if (isAllWS(el)) {
      el.textContent = '';
    }
  });
})();