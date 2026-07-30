export function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-form-status]");
  if (!form || !status) return;

  const contactEmail = form.dataset.contactEmail || "monographicalpixel@gmail.com";
  const submitButton = form.querySelector('button[type="submit"]');

  const setStatus = (message, tone = "neutral") => {
    status.textContent = message;
    status.dataset.statusTone = tone;
    status.style.color = tone === "error" ? "#ffb4c8" : tone === "success" ? "#8ef0c5" : "var(--color-accent)";
  };

  const openEmailFallback = (data) => {
    const subject = encodeURIComponent(`Portfolio inquiry for Manav Agarwal from ${data.get("name")}`);
    const body = encodeURIComponent(`${data.get("message")}\n\nReply to: ${data.get("email")}`);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      setStatus("Please complete the required fields with a valid email.", "error");
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      message: String(data.get("message") || "").trim(),
      website: String(data.get("website") || "").trim()
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending…";
    }
    setStatus("Sending your message securely…");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw Object.assign(new Error(result.error || "Message delivery failed."), { fallback: true });
      }

      form.reset();
      setStatus("Message sent successfully. I’ll reply by email.", "success");
    } catch (error) {
      setStatus("Direct delivery is unavailable right now. Opening your email app as a fallback—no fake success was recorded.", "error");
      if (error?.fallback !== false) window.setTimeout(() => openEmailFallback(data), 350);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
    }
  });
}
