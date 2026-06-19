;(function() {
  var previous = document.scripts[document.scripts.length - 1].previousElementSibling;

  while(previous.tagName !== 'DIV') {
    previous = previous.previousElementSibling;
  }

  
  // Adjust credit card Year and Month input fields
  previous.querySelectorAll('select').forEach(function(select) {
    select.classList.add('custom-select');
    select.classList.remove('mr-2');

    if (select.classList.contains('year')) {
      select.placeholder = 'Year';
    } else if (select.classList.contains('month')) {
      select.placeholder = 'Month';
    }
  });

  // Adjust CVC input field
  var cvc = previous.querySelector('input[name="invoice_payment[card_verification]"]');
  cvc.required = true;
  cvc.maxLength = 4;
  cvc.title = 'CVC is a 3 or 4 digit number on a back of your card';
  cvc.pattern = '\\d{3,4}';

  cvc.addEventListener('keypress', function(e) {
    if (isNaN(e.key)) {
      e.preventDefault();
    }
  });

  previous.querySelectorAll('.expiration-selects .form-control').forEach(function(control) {
    var el = document.createElement('div');

    el.classList.add('form-group', 'col-12', 'col-md-4');
    getParents(control, '.form-row')[0].appendChild(el);
    el.appendChild(control);                    
  });

  // Make 'state' and 'province' field work correctly in billing address, depending on the selected country
  var country = previous.querySelector('[id^="invoice_payment_billing_address_country_code"]');
  var state = previous.querySelector('#state [id^="invoice_payment_billing_address_state"]');
  var province = previous.querySelector('#province [id^="invoice_payment_billing_address_state"]');

  if (state) {
    state.removeChild(state.firstElementChild);
    state.placeholder = 'State*';
  }

  if (country) {
    country.addEventListener('change', function() {
      if (country.value === 'US') {
        getParents(province, '#province')[0].classList.add('hide');
        province.required = false;

        getParents(state, '#state')[0].classList.remove('hide');
        state.required = true;
      } else if (country.value === 'CA') {
        getParents(state, '#state')[0].classList.add('hide');
        state.required = false;

        getParents(province, '#province')[0].classList.remove('hide');
        province.required = true;
      } else {
        getParents(state, '#state')[0].classList.add('hide');
        state.required = false;
        
        getParents(province, '#province')[0].classList.add('hide');
        province.required = false;
      }
    });

    country.dispatchEvent(new Event('change', { 'bubbles': true }));
  }
})();