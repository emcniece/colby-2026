// Forms are not wired to a backend yet. Nothing is sent anywhere:
//  - plain <form data-static-form> submits are blocked and show a notice;
//  - scripted POSTs (the homepage priorities survey/sign-up use fetch) get a
//    fake success response so the multi-step UI still advances.
// Replace this file when a submission endpoint exists.
(function () {
  var MESSAGE = 'Thanks! Online forms are being moved and are not accepting submissions yet. ' +
    'Please email us in the meantime.';

  var realFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    if (method === 'POST' && (url === '#' || /(^|\/)#$|\/forms\//.test(url))) {
      console.log('[static-forms] Submission not sent (no backend yet):', url);
      return Promise.resolve(new Response('', { status: 200 }));
    }
    return realFetch.apply(this, arguments);
  };

  // Bubble phase: forms whose page script already handled the submit (and
  // called preventDefault) are left alone.
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (e.defaultPrevented || !form.hasAttribute || !form.hasAttribute('data-static-form')) return;
    e.preventDefault();

    var box = form.querySelector('.static-form-notice');
    if (!box) {
      box = document.createElement('div');
      box.className = 'static-form-notice alert alert-info mt-3';
      box.setAttribute('role', 'status');
      box.textContent = MESSAGE;
      form.appendChild(box);
    }
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
})();
