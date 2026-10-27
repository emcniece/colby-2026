(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const donationSectionElement = document.querySelector(".donation");
    // Get or create live region for announcements
    const liveRegion = donationSectionElement?.querySelector("#donation-announcement");

    // Helper function to announce to screen readers
    function announce(message) {
      if (liveRegion) {
        liveRegion.textContent = message;
        // Clear after announcement to allow repeated announcements of same text
        setTimeout(function () {
          liveRegion.textContent = "";
        }, 1000);
      }
    }

    const lang = document.documentElement.lang || 'en';

    const paymentIsAvailableAnnouncement = {
      en: "Payment section is now available",
      fr: "La section de paiement est maintenant disponible",
      es: "La sección de pago ya está disponible",
    }
    const paymentIsNotAvailableAnnouncement = {
      en: "Payment section is no longer available",
      fr: "La section de paiement n’est plus disponible",
      es: "La sección de pago ya no está disponible",
    };

    // Manage payment section accessibility
    const ccInfo = donationSectionElement?.querySelector("#cc-info");
    const ccDisclaimer = donationSectionElement?.querySelector("[data-payment-disclaimer]");

    if (ccInfo && ccDisclaimer) {
      // Monitor for changes to payment disclaimer visibility
      // When it becomes hidden, the payment section is active
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (
            mutation.target === ccDisclaimer &&
            mutation.attributeName === "style"
          ) {
            const isDisclaimerHidden =
              ccDisclaimer.style.display === "none" ||
              window.getComputedStyle(ccDisclaimer).display === "none";

            if (isDisclaimerHidden) {
              announce(paymentIsAvailableAnnouncement[lang]);
            } else {
              announce(paymentIsNotAvailableAnnouncement[lang]);
            }
          }
        });
      });

      observer.observe(ccDisclaimer, {
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }
  });
})();
