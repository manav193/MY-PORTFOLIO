export function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-form-status]");
  if (!form || !status) return;

  const contactEmail = form.dataset.contactEmail;
  if (!contactEmail) {
    form.hidden = true;
    status.textContent = "Contact form unavailable. Please use the direct email link.";
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      status.textContent = "Please complete the required fields with a valid email.";
      status.style.color = "#ffb4c8";
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const subject = encodeURIComponent(`Portfolio inquiry for Manav Agarwal from ${data.get("name")}`);
    const body = encodeURIComponent(`${data.get("message")}\n\nReply to: ${data.get("email")}`);
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Opening Email App";
    }
    status.textContent = "Message prepared. Opening your email app.";
    status.style.color = "var(--color-accent)";
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    window.setTimeout(() => {
      form.reset();
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Prepare Email";
      }
    }, 800);
  });
}
