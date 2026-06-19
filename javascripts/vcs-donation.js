;(function() {
  var previous = document.scripts[document.scripts.length - 1].previousElementSibling;

  while(!previous.matches('.donation')) {
    previous = previous.previousElementSibling;
  }

  var isExcerpt = previous.getAttribute('data-is-excerpt');

  var inputs = previous.querySelectorAll('#donation-amounts input[type="radio"]:not([id^="donation_amount_other"])');

  // If amount options are shown
  if (inputs.length) {
    var donationAmount = previous.querySelector('span[id^="donation_amount"]');
    var donationInterval = previous.querySelector('.nb_donation_interval');

    // Turn donation amount labels into buttons
    inputs.forEach(function(input) {
      input.nextElementSibling.classList.add('btn', 'btn-primary', 'mb-3', 'p-3', 'mr-sm-3');
    });

    var otherInput = previous.querySelector('[id^="donation_amount_other"]');

    if (otherInput) {
      otherInput.type = 'number';
      otherInput.min = '0.01';
      otherInput.step = '0.01';
      otherInput.required = true;

      otherInput.classList.remove('form-control-sm', 'd-inline-block', 'w-auto');
      otherInput.addEventListener('change', function(e) {
        setDisplayValue(e.target.value);
      });
    }

    previous.querySelectorAll('#donation-amounts label:not([for^="donation_amount_other"])').forEach(function(label) {
      var amount = Number(label.previousElementSibling.value);

      label.classList.remove('btn-primary');
      label.classList.add('btn-color-2');
      label.setAttribute('role', 'button');
    });

    // Handle donation amounts toggle states
    previous.addEventListener('click', function(e) {
      if (!e.target.matches('#donation-amounts label.btn')) return;

      if (otherInput) {
        // Fill the other input value
        e.target.click();
        otherInput.value = e.target.previousElementSibling.value;
      }

      if (donationAmount) {
        // Fill the donation amount text that is displayed to the user
        setDisplayValue(e.target.previousElementSibling.value);
      }

      if (donationInterval) {
        // If there is donation interval (in case of donation v1 pages, it's 'monthly' only), remove the 'hidden' class and display the
        // text to the user
        donationInterval.classList.remove('hidden');
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
    otherInput.parentElement.insertBefore(wrapper, otherInput);
    wrapper.firstElementChild.firstElementChild.appendChild(otherInput);


    // Retrieve 'amount' GET parameter
    var amountParam = getParameter('amount');

    if (amountParam) {
      // If it exists, get the radio button with the corresponding value
      var matchingRadio = previous.querySelector('#donation-amounts input[type="radio"][value="' + amountParam + '"]');

      if (matchingRadio) {
        // If radio found, trigger the click event on its label
        matchingRadio.nextElementSibling.click();
      }
    }
  }


  // Make 'state' and 'province' field work correctly in billing address, depending on the selected country
  var country = previous.querySelector('[id^="donation_billing_address_country_code"]');
  var state = previous.querySelector('#state [id^="donation_billing_address_state"]');
  var province = previous.querySelector('#province [id^="donation_billing_address_state"]');

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


  var numOfInstallments = previous.querySelector('[id^="donation_num_installments"]');
  if (numOfInstallments) {
    numOfInstallments.placeholder = 'No of installments';
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
  var cvc = previous.querySelector('input[name="donation[card_verification]"]');

  if (cvc) {
    cvc.required = true;
    cvc.maxLength = 4;
    cvc.title = 'CVC is a 3 or 4 digit number on a back of your card';
    cvc.pattern = '\\d{3,4}';

    cvc.addEventListener('keypress', function(e) {
      if (isNaN(e.key)) {
        e.preventDefault();
      }
    });
  }

  var ccExpires = previous.querySelector('label[for^="donation_card_expires_on"]');

  if (ccExpires) {
    ccExpires.parentElement.querySelectorAll('.form-control').forEach(function(control) {
      var el = document.createElement('div');

      el.classList.add('form-group', 'col-12', 'col-md-4');
      getParents(control, '.form-row')[0].appendChild(el);
      el.appendChild(control);
    });
  }

  function setDisplayValue(num) {
    var val = parseFloat(num).toFixed(2);
    otherInput.value = val;
    donationAmount.textContent = "$" + val;
  }
})();
