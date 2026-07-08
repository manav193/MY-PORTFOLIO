export function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-form-status]");
  if (!form || !status) return;

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
    status.textContent = "Message prepared. Opening your email app so you can choose the recipient.";
    status.style.color = "var(--accent)";
    form.reset();
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  });
}
