;(function() {
  var previous = document.scripts[document.scripts.length - 1].previousElementSibling;

  while(previous.tagName !== 'DIV') {
    previous = previous.previousElementSibling;
  }

  var inputs = previous.querySelectorAll('#moneybomb-amounts input[type="radio"]:not([id^="pledge_amount_other"])');

  // If amount options are shown
  if (inputs.length) {
    // Turn moneybomb amount labels into buttons
    inputs.forEach(function(input) {
      input.nextElementSibling.classList.add('btn', 'btn-primary', 'mb-3', 'p-3', 'mr-sm-3');
    });

    var otherInput = previous.querySelector('[id^="pledge_amount_other"]');

    if (otherInput) {
      otherInput.type = 'number';
      otherInput.min = '0.01';
      otherInput.step = '0.01';
      otherInput.required = true;
    
      otherInput.classList.remove('form-control-sm', 'd-inline-block', 'w-auto', 'ml-2');
    }

    otherInput.addEventListener('blur', function(e) {
      inputs.forEach(function(input) {
        var label = input.nextElementSibling;
        label.classList.remove('active', 'btn-primary');
        label.setAttribute('aria-pressed', false);
        label.classList.add('btn-color-2');
      });
    });

    // Change other amount text
    previous.querySelector('[id^="pledge_amount_other"]').previousElementSibling.textContent = 'Other amount:';

    previous.querySelectorAll('#moneybomb-amounts label:not([for^="pledge_amount_other"])').forEach(function(label) {
      var amount = Number(label.previousElementSibling.value);

      label.classList.remove('btn-primary');
      label.classList.add('btn-color-2');
    });

    // Handle moneybomb amounts toggle states
    previous.addEventListener('click', function(e) {
      if (!e.target.matches('#moneybomb-amounts label.btn')) return;

      inputs.forEach(function(input) {
        var label = input.nextElementSibling;
        if (label !== e.target) {
          label.classList.remove('active', 'btn-primary');
          label.setAttribute('aria-pressed', false);
          label.classList.add('btn-color-2');
        } else {
          label.classList.remove('btn-color-2');
          label.classList.add('btn-primary', 'active');
          e.stopImmediatePropagation();
        }
      });

      if (otherInput) {
        // Fill the other input value
        otherInput.value = e.target.previousElementSibling.value;
      }
    });

    var wrapper = document.createElement('div');
    
    wrapper.innerHTML = '<div class="form-row">'
      + '<div class="col-12 col-md-6">'
      + '<div class="input-group donation-other-input-container">'
      + '<div class="input-group-prepend"><span class="input-group-text currency-symbol">$</span></div>'
      + '</div>'
      + '</div>'
      + '</div>';

    wrapper = wrapper.firstElementChild;
    var otherInputParent = otherInput.parentElement;
    otherInputParent.parentElement.appendChild(wrapper);
    wrapper.firstElementChild.firstElementChild.appendChild(otherInput);
    otherInputParent.parentElement.removeChild(otherInputParent);
  }
})();