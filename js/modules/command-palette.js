const commands = [
  { label: "Go to About", hint: "Story and timeline", target: "#about" },
  { label: "Go to Skills", hint: "Capability map", target: "#skills" },
  { label: "Go to Projects", hint: "Featured work", target: "#projects" },
  { label: "Go to Resume", hint: "Education and proof", target: "#resume" },
  { label: "Go to GitHub", hint: "Development projects", target: "#github" },
  { label: "Go to Contact", hint: "Email and form", target: "#contact" },
  { label: "Open GitHub", hint: "manav193", url: "https://github.com/manav193" }
];

export function initCommandPalette() {
  const dialog = document.querySelector("[data-command]");
  const open = document.querySelector("[data-command-open]");
  const close = document.querySelector("[data-command-close]");
  const input = document.querySelector("[data-command-input]");
  const list = document.querySelector("[data-command-list]");
  if (!dialog || !input || !list) return;

  const render = () => {
    const query = input.value.toLowerCase();
    const filtered = commands.filter((command) => `${command.label} ${command.hint}`.toLowerCase().includes(query));
    list.innerHTML = "";
    filtered.forEach((command) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "command-item";
      button.innerHTML = `<span>${command.label}</span><small>${command.hint}</small>`;
      button.addEventListener("click", () => runCommand(command, dialog));
      list.append(button);
    });
  };

  const show = () => {
    dialog.showModal();
    render();
    input.focus();
  };

  open?.addEventListener("click", show);
  close?.addEventListener("click", () => dialog.close());
  input.addEventListener("input", render);

  window.addEventListener("keydown", (event) => {
    const isCommand = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
    if (isCommand) {
      event.preventDefault();
      dialog.open ? dialog.close() : show();
    }
    if (event.key.toLowerCase() === "g" && event.shiftKey) {
      document.documentElement.classList.toggle("easter-egg");
    }
  });
}

function runCommand(command, dialog) {
  dialog.close();
  if (command.url) {
    window.open(command.url, "_blank", "noopener");
    return;
  }
  document.querySelector(command.target)?.scrollIntoView({ behavior: "smooth" });
}
