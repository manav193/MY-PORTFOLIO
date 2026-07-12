// Arcade Machine Customization Module
// Handcrafted ES Module for Cabinet Visual State customization

export const ArcadeCustomizer = {
  persistedConfig: null,
  draftConfig: null,
  snapshotConfig: null,
  initialized: false,
  activeCategory: "cabinet",
  
  DEFAULT_CONFIG: {
    chassisTheme: "graphite",
    accentColor: "#35d0ba",
    secondaryColor: "#ff365d",
    marqueeText: "ARCADE",
    marqueeStyle: "classic",
    buttonColorA: "#35d0ba",
    buttonColorB: "#ff365d",
    joystickColor: "#151515",
    ledColor: "#35d0ba",
    screenFilter: "standard",
    scanlineIntensity: 0.35,
    screenGlow: 0.5,
    cabinetGlow: 0.5,
    sideArt: "none",
    decalStyle: "industrial",
    controlDeckStyle: "graphite",
    coinLightColor: "#ff365d",
    speakerStyle: "mesh",
    hardwareFinish: "anodized"
  },
  
  BUILTIN_THEMES: {
    graphite: {
      name: "Graphite Prototype",
      chassisTheme: "graphite",
      accentColor: "#35d0ba",
      secondaryColor: "#ff365d",
      marqueeText: "ARCADE",
      marqueeStyle: "classic",
      buttonColorA: "#35d0ba",
      buttonColorB: "#ff365d",
      joystickColor: "#151515",
      ledColor: "#35d0ba",
      screenFilter: "standard",
      scanlineIntensity: 0.35,
      screenGlow: 0.5,
      cabinetGlow: 0.5,
      sideArt: "none",
      decalStyle: "industrial",
      controlDeckStyle: "graphite",
      coinLightColor: "#ff365d",
      speakerStyle: "mesh",
      hardwareFinish: "anodized"
    },
    red: {
      name: "Nintendo Red",
      chassisTheme: "red",
      accentColor: "#e60012",
      secondaryColor: "#ffffff",
      marqueeText: "NINTENDO",
      marqueeStyle: "arcade",
      buttonColorA: "#e60012",
      buttonColorB: "#ffffff",
      joystickColor: "#ffffff",
      ledColor: "#e60012",
      screenFilter: "sharp",
      scanlineIntensity: 0.2,
      screenGlow: 0.4,
      cabinetGlow: 0.6,
      sideArt: "lines",
      decalStyle: "clean",
      controlDeckStyle: "red",
      coinLightColor: "#e60012",
      speakerStyle: "grille",
      hardwareFinish: "matte"
    },
    blue: {
      name: "Midnight Blue",
      chassisTheme: "blue",
      accentColor: "#1e3a8a",
      secondaryColor: "#f59e0b",
      marqueeText: "MIDNIGHT",
      marqueeStyle: "arcade",
      buttonColorA: "#1e3a8a",
      buttonColorB: "#f59e0b",
      joystickColor: "#111827",
      ledColor: "#3b82f6",
      screenFilter: "warm",
      scanlineIntensity: 0.4,
      screenGlow: 0.6,
      cabinetGlow: 0.4,
      sideArt: "stripes",
      decalStyle: "industrial",
      controlDeckStyle: "blue",
      coinLightColor: "#f59e0b",
      speakerStyle: "mesh",
      hardwareFinish: "metallic"
    },
    cream: {
      name: "Retro Cream",
      chassisTheme: "cream",
      accentColor: "#d97706",
      secondaryColor: "#7c2d12",
      marqueeText: "RETRO",
      marqueeStyle: "classic",
      buttonColorA: "#d97706",
      buttonColorB: "#7c2d12",
      joystickColor: "#d97706",
      ledColor: "#d97706",
      screenFilter: "crt-soft",
      scanlineIntensity: 0.6,
      screenGlow: 0.3,
      cabinetGlow: 0.3,
      sideArt: "waves",
      decalStyle: "retro",
      controlDeckStyle: "cream",
      coinLightColor: "#d97706",
      speakerStyle: "slits",
      hardwareFinish: "textured"
    },
    violet: {
      name: "Cyber Violet",
      chassisTheme: "violet",
      accentColor: "#8b5cf6",
      secondaryColor: "#ec4899",
      marqueeText: "CYBER",
      marqueeStyle: "neon",
      buttonColorA: "#8b5cf6",
      buttonColorB: "#ec4899",
      joystickColor: "#1f2937",
      ledColor: "#a78bfa",
      screenFilter: "crt-strong",
      scanlineIntensity: 0.5,
      screenGlow: 0.7,
      cabinetGlow: 0.7,
      sideArt: "circuit",
      decalStyle: "neon",
      controlDeckStyle: "violet",
      coinLightColor: "#ec4899",
      speakerStyle: "mesh",
      hardwareFinish: "metallic"
    },
    forest: {
      name: "Forest Industrial",
      chassisTheme: "forest",
      accentColor: "#059669",
      secondaryColor: "#d97706",
      marqueeText: "FOREST",
      marqueeStyle: "classic",
      buttonColorA: "#059669",
      buttonColorB: "#d97706",
      joystickColor: "#111827",
      ledColor: "#059669",
      screenFilter: "standard",
      scanlineIntensity: 0.3,
      screenGlow: 0.4,
      cabinetGlow: 0.5,
      sideArt: "lines",
      decalStyle: "clean",
      controlDeckStyle: "forest",
      coinLightColor: "#d97706",
      speakerStyle: "grille",
      hardwareFinish: "matte"
    },
    copper: {
      name: "Sunset Copper",
      chassisTheme: "copper",
      accentColor: "#ea580c",
      secondaryColor: "#1e1b4b",
      marqueeText: "SUNSET",
      marqueeStyle: "neon",
      buttonColorA: "#ea580c",
      buttonColorB: "#1e1b4b",
      joystickColor: "#1e1b4b",
      ledColor: "#ea580c",
      screenFilter: "warm",
      scanlineIntensity: 0.4,
      screenGlow: 0.5,
      cabinetGlow: 0.6,
      sideArt: "waves",
      decalStyle: "neon",
      controlDeckStyle: "copper",
      coinLightColor: "#ea580c",
      speakerStyle: "slits",
      hardwareFinish: "metallic"
    },
    mono: {
      name: "Monochrome",
      chassisTheme: "mono",
      accentColor: "#ffffff",
      secondaryColor: "#000000",
      marqueeText: "MONO",
      marqueeStyle: "classic",
      buttonColorA: "#ffffff",
      buttonColorB: "#000000",
      joystickColor: "#ffffff",
      ledColor: "#ffffff",
      screenFilter: "mono-green",
      scanlineIntensity: 0.5,
      screenGlow: 0.4,
      cabinetGlow: 0.2,
      sideArt: "grid",
      decalStyle: "clean",
      controlDeckStyle: "mono",
      coinLightColor: "#ffffff",
      speakerStyle: "slits",
      hardwareFinish: "matte"
    }
  },

  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    const saved = localStorage.getItem('arcade_machine_customization');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.config && this.validateConfig(parsed.config)) {
          this.persistedConfig = parsed.config;
        }
      } catch (e) {
        console.warn('Failed to parse customization schema, resetting to default', e);
      }
    }
    
    if (!this.persistedConfig) {
      this.persistedConfig = { ...this.DEFAULT_CONFIG };
      this.saveToStorage();
    }
    
    this.draftConfig = { ...this.persistedConfig };
    this.applyConfig(this.persistedConfig);
  },
  
  validateConfig(config) {
    if (!config || typeof config !== 'object') return false;
    
    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    const allowedThemes = ["graphite", "red", "blue", "cream", "violet", "forest", "copper", "mono"];
    const allowedFilters = ["standard", "sharp", "warm", "crt-soft", "crt-strong", "mono-green", "mono-amber"];
    const allowedFinishes = ["anodized", "matte", "metallic", "textured"];
    const allowedSideArt = ["none", "lines", "stripes", "grid", "waves", "circuit"];

    const rules = {
      chassisTheme: val => allowedThemes.includes(val),
      accentColor: val => hexPattern.test(val),
      secondaryColor: val => hexPattern.test(val),
      buttonColorA: val => hexPattern.test(val),
      buttonColorB: val => hexPattern.test(val),
      joystickColor: val => hexPattern.test(val),
      ledColor: val => hexPattern.test(val),
      coinLightColor: val => hexPattern.test(val),
      screenFilter: val => allowedFilters.includes(val),
      hardwareFinish: val => allowedFinishes.includes(val),
      sideArt: val => allowedSideArt.includes(val),
      scanlineIntensity: val => typeof val === 'number' && val >= 0 && val <= 1,
      screenGlow: val => typeof val === 'number' && val >= 0 && val <= 1,
      cabinetGlow: val => typeof val === 'number' && val >= 0 && val <= 1,
      marqueeText: val => typeof val === 'string' && val.length <= 15
    };
    
    for (const key of Object.keys(rules)) {
      if (!(key in config) || !rules[key](config[key])) {
        return false;
      }
    }
    return true;
  },
  
  applyConfig(config) {
    const chassis = document.querySelector('.cabinet-chassis');
    if (!chassis) return;
    
    // Map variables directly to .cabinet-chassis scope
    chassis.style.setProperty('--machine-accent', config.accentColor);
    chassis.style.setProperty('--machine-secondary', config.secondaryColor);
    chassis.style.setProperty('--machine-button-a', config.buttonColorA);
    chassis.style.setProperty('--machine-button-b', config.buttonColorB);
    chassis.style.setProperty('--machine-joystick-color', config.joystickColor);
    chassis.style.setProperty('--machine-led-color', config.ledColor);
    chassis.style.setProperty('--machine-marquee-color', config.ledColor);
    chassis.style.setProperty('--machine-screen-glow', config.screenGlow);
    chassis.style.setProperty('--machine-cabinet-glow', config.cabinetGlow);
    chassis.style.setProperty('--machine-scanline-opacity', config.scanlineIntensity);
    chassis.style.setProperty('--machine-coin-light', config.coinLightColor);
    
    // Set custom state data attributes
    chassis.setAttribute('data-chassis-theme', config.chassisTheme);
    chassis.setAttribute('data-screen-filter', config.screenFilter);
    chassis.setAttribute('data-side-art', config.sideArt);
    chassis.setAttribute('data-decal-style', config.decalStyle);
    chassis.setAttribute('data-control-deck-style', config.controlDeckStyle);
    chassis.setAttribute('data-hardware-finish', config.hardwareFinish);
    
    // Screen filters string mappings
    const filterMap = {
      standard: "none",
      sharp: "contrast(1.08) saturate(1.1)",
      warm: "sepia(0.2) saturate(1.2) contrast(1.05)",
      "crt-soft": "contrast(1.05) brightness(1.05) saturate(1.15) blur(0.3px)",
      "crt-strong": "contrast(1.15) brightness(1.1) saturate(1.25) blur(0.6px)",
      "mono-green": "grayscale(1) sepia(0.85) hue-rotate(75deg) saturate(1.8) brightness(1.1)",
      "mono-amber": "grayscale(1) sepia(0.85) hue-rotate(-15deg) saturate(1.8) brightness(1.1)"
    };
    
    const filterStr = filterMap[config.screenFilter] || "none";
    chassis.style.setProperty('--machine-screen-filter', filterStr);
    
    if (window.ArcadeHardware) {
      window.ArcadeHardware.updateMarquee(window.ArcadeOS ? window.ArcadeOS.state : 'HOME');
    }
  },
  
  updateSetting(key, value) {
    if (key === 'marqueeText') {
      value = value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').substring(0, 15);
    }
    
    this.draftConfig[key] = value;
    this.applyConfig(this.draftConfig);
    
    // Refresh dirty validation HUD check
    const applyBtn = document.getElementById('builder-apply-btn');
    if (applyBtn) {
      const isDirty = this.isDirty();
      applyBtn.classList.toggle('active', isDirty);
    }
  },
  
  isDirty() {
    return JSON.stringify(this.draftConfig) !== JSON.stringify(this.persistedConfig);
  },
  
  saveToStorage() {
    const payload = {
      schemaVersion: 1,
      activePresetId: "custom",
      config: this.persistedConfig,
      presets: []
    };
    localStorage.setItem('arcade_machine_customization', JSON.stringify(payload));
  },
  
  open(view) {
    this.snapshotConfig = { ...this.persistedConfig };
    this.draftConfig = { ...this.persistedConfig };
    this.applyConfig(this.draftConfig);
    
    this.renderBuilderUI(view);
  },
  
  cancel() {
    this.draftConfig = { ...this.snapshotConfig };
    this.applyConfig(this.snapshotConfig);
  },
  
  apply() {
    this.persistedConfig = { ...this.draftConfig };
    this.saveToStorage();
    this.applyConfig(this.persistedConfig);
    
    // Pulse storage LED explicitly
    if (window.ArcadeHardware) {
      window.ArcadeHardware.pulseStorage();
    }
  },
  
  resetToDefault() {
    this.draftConfig = { ...this.DEFAULT_CONFIG };
    this.applyConfig(this.draftConfig);
    this.renderBuilderUI(document.getElementById('arcade-app-view'));
  },
  
  loadTheme(themeId) {
    const theme = this.BUILTIN_THEMES[themeId];
    if (theme) {
      this.draftConfig = { ...this.draftConfig, ...theme };
      this.applyConfig(this.draftConfig);
      this.renderBuilderUI(document.getElementById('arcade-app-view'));
    }
  },
  
  renderBuilderUI(view) {
    if (!view) return;
    
    // UI Layout categories list
    const categories = [
      { id: "cabinet", label: "Cabinet" },
      { id: "colors", label: "Colors" },
      { id: "marquee", label: "Marquee" },
      { id: "controls", label: "Controls" },
      { id: "screen", label: "Screen" },
      { id: "lighting", label: "Lighting" }
    ];
    
    view.innerHTML = `
      <div class="sys-app customizer-app">
        <div class="sys-header">
          <h2>MACHINE CUSTOMIZER</h2>
          <button class="sys-back-btn" id="builder-back-btn">BACK (ESC)</button>
        </div>
        
        <div class="builder-layout">
          <!-- Left Categories list -->
          <div class="builder-nav-tabs">
            ${categories.map(cat => `
              <button class="builder-tab-btn ${cat.id === this.activeCategory ? 'active' : ''}" data-cat-id="${cat.id}">
                ${cat.label.toUpperCase()}
              </button>
            `).join('')}
          </div>
          
          <!-- Right Properties Controls Panel -->
          <div class="builder-panel" id="builder-controls-panel">
            ${this.renderActiveCategoryControls()}
          </div>
        </div>
        
        <!-- Bottom Action bar -->
        <div class="builder-actions-bar">
          <button id="builder-reset-btn" class="sys-btn">RESET DEFAULT</button>
          <div class="actions-right">
            <button id="builder-cancel-btn" class="sys-btn">CANCEL</button>
            <button id="builder-apply-btn" class="sys-btn active-btn">APPLY CONFIG</button>
          </div>
        </div>
      </div>
    `;
    
    this.bindEvents(view);
  },
  
  renderActiveCategoryControls() {
    const cfg = this.draftConfig;
    
    if (this.activeCategory === "cabinet") {
      const themes = Object.keys(this.BUILTIN_THEMES);
      return `
        <div class="controls-group">
          <h3>CHASSIS PRESETS</h3>
          <div class="swatches-grid">
            ${themes.map(t => `
              <button class="theme-swatch-btn ${cfg.chassisTheme === t ? 'active' : ''}" data-theme-id="${t}">
                ${this.BUILTIN_THEMES[t].name}
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="controls-group">
          <h3>HARDWARE FINISH</h3>
          <select id="select-hardware-finish" class="sys-input">
            <option value="anodized" ${cfg.hardwareFinish === "anodized" ? "selected" : ""}>Anodized Steel</option>
            <option value="matte" ${cfg.hardwareFinish === "matte" ? "selected" : ""}>Matte Powdercoat</option>
            <option value="metallic" ${cfg.hardwareFinish === "metallic" ? "selected" : ""}>Specular Metallic</option>
            <option value="textured" ${cfg.hardwareFinish === "textured" ? "selected" : ""}>Textured Rough</option>
          </select>
        </div>
      `;
    }
    
    if (this.activeCategory === "colors") {
      return `
        <div class="controls-group">
          <h3>accent colors</h3>
          <div class="setting-item">
            <label for="picker-accent">Primary Accent</label>
            <input type="color" id="picker-accent" value="${cfg.accentColor}" class="sys-input color-target">
            <input type="text" id="hex-accent" value="${cfg.accentColor.toUpperCase()}" class="sys-input hex-target" maxLength="7">
          </div>
          <div class="setting-item">
            <label for="picker-secondary">Secondary color</label>
            <input type="color" id="picker-secondary" value="${cfg.secondaryColor}" class="sys-input color-target">
            <input type="text" id="hex-secondary" value="${cfg.secondaryColor.toUpperCase()}" class="sys-input hex-target" maxLength="7">
          </div>
        </div>
      `;
    }
    
    if (this.activeCategory === "marquee") {
      return `
        <div class="controls-group">
          <h3>MARQUEE HEADER</h3>
          <div class="setting-item">
            <label for="input-marquee-text">Marquee Text</label>
            <input type="text" id="input-marquee-text" value="${cfg.marqueeText}" class="sys-input" maxLength="15">
          </div>
        </div>
      `;
    }
    
    if (this.activeCategory === "controls") {
      return `
        <div class="controls-group">
          <h3>DECK LAYOUT COLORS</h3>
          <div class="setting-item">
            <label for="picker-btn-a">Action Button A</label>
            <input type="color" id="picker-btn-a" value="${cfg.buttonColorA}" class="sys-input color-target">
            <input type="text" id="hex-btn-a" value="${cfg.buttonColorA.toUpperCase()}" class="sys-input hex-target" maxLength="7">
          </div>
          <div class="setting-item">
            <label for="picker-btn-b">Action Button B</label>
            <input type="color" id="picker-btn-b" value="${cfg.buttonColorB}" class="sys-input color-target">
            <input type="text" id="hex-btn-b" value="${cfg.buttonColorB.toUpperCase()}" class="sys-input hex-target" maxLength="7">
          </div>
          <div class="setting-item">
            <label for="picker-joystick">Joystick Ball</label>
            <input type="color" id="picker-joystick" value="${cfg.joystickColor}" class="sys-input color-target">
            <input type="text" id="hex-joystick" value="${cfg.joystickColor.toUpperCase()}" class="sys-input hex-target" maxLength="7">
          </div>
        </div>
      `;
    }
    
    if (this.activeCategory === "screen") {
      return `
        <div class="controls-group">
          <h3>FILTERS & CRT EFFECTS</h3>
          <div class="setting-item">
            <label for="select-screen-filter">CRT Filter Preset</label>
            <select id="select-screen-filter" class="sys-input">
              <option value="standard" ${cfg.screenFilter === "standard" ? "selected" : ""}>Standard LCD</option>
              <option value="sharp" ${cfg.screenFilter === "sharp" ? "selected" : ""}>Pixel Sharp</option>
              <option value="warm" ${cfg.screenFilter === "warm" ? "selected" : ""}>Warm Retro Arcade</option>
              <option value="crt-soft" ${cfg.screenFilter === "crt-soft" ? "selected" : ""}>CRT Soft Phosphor</option>
              <option value="crt-strong" ${cfg.screenFilter === "crt-strong" ? "selected" : ""}>CRT Heavy scanlines</option>
              <option value="mono-green" ${cfg.screenFilter === "mono-green" ? "selected" : ""}>Monochrome Green</option>
              <option value="mono-amber" ${cfg.screenFilter === "mono-amber" ? "selected" : ""}>Monochrome Amber</option>
            </select>
          </div>
          <div class="setting-item">
            <label for="range-scanline">Scanline Intensity</label>
            <input type="range" id="range-scanline" min="0.0" max="0.8" step="0.05" value="${cfg.scanlineIntensity}">
            <span>${Math.round(cfg.scanlineIntensity * 100)}%</span>
          </div>
        </div>
      `;
    }
    
    if (this.activeCategory === "lighting") {
      return `
        <div class="controls-group">
          <h3>CABINET LIGHTING & GLOW</h3>
          <div class="setting-item">
            <label for="picker-led">Status LED Color</label>
            <input type="color" id="picker-led" value="${cfg.ledColor}" class="sys-input color-target">
            <input type="text" id="hex-led" value="${cfg.ledColor.toUpperCase()}" class="sys-input hex-target" maxLength="7">
          </div>
          <div class="setting-item">
            <label for="picker-coin">Coin Slot LED</label>
            <input type="color" id="picker-coin" value="${cfg.coinLightColor}" class="sys-input color-target">
            <input type="text" id="hex-coin" value="${cfg.coinLightColor.toUpperCase()}" class="sys-input hex-target" maxLength="7">
          </div>
          <div class="setting-item">
            <label for="range-screen-glow">Screen Glow</label>
            <input type="range" id="range-screen-glow" min="0.0" max="1.0" step="0.05" value="${cfg.screenGlow}">
            <span>${Math.round(cfg.screenGlow * 100)}%</span>
          </div>
          <div class="setting-item">
            <label for="range-cabinet-glow">Cabinet Ambient Glow</label>
            <input type="range" id="range-cabinet-glow" min="0.0" max="1.0" step="0.05" value="${cfg.cabinetGlow}">
            <span>${Math.round(cfg.cabinetGlow * 100)}%</span>
          </div>
        </div>
      `;
    }
    
    return "";
  },
  
  bindEvents(view) {
    // 1. Back button (exits builder, checks dirty protection)
    view.querySelector('#builder-back-btn').addEventListener('click', () => {
      window.ArcadeOS.goHome();
    });
    
    // 2. Tab Navigation clicks
    view.querySelectorAll('.builder-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeCategory = btn.getAttribute('data-cat-id');
        this.renderBuilderUI(view);
        if (window.ArcadeAudio) window.ArcadeAudio.playTick();
      });
    });
    
    // 3. Setup change event listeners inside parameters controls
    // Theme swatch selectors
    view.querySelectorAll('.theme-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeId = btn.getAttribute('data-theme-id');
        this.loadTheme(themeId);
        if (window.ArcadeAudio) window.ArcadeAudio.playSelect();
      });
    });
    
    // Finish selects
    const finishSel = view.querySelector('#select-hardware-finish');
    if (finishSel) {
      finishSel.addEventListener('change', () => {
        this.updateSetting('hardwareFinish', finishSel.value);
      });
    }
    
    // Color inputs & text Hex inputs sync
    const colorTargets = view.querySelectorAll('.color-target');
    colorTargets.forEach(picker => {
      const hexInput = picker.parentElement.querySelector('.hex-target');
      
      picker.addEventListener('input', () => {
        let key = picker.id.replace('picker-', '');
        if (key === 'btn-a') key = 'buttonColorA';
        if (key === 'btn-b') key = 'buttonColorB';
        if (key === 'joystick') key = 'joystickColor';
        if (key === 'led') key = 'ledColor';
        if (key === 'coin') key = 'coinLightColor';
        
        hexInput.value = picker.value.toUpperCase();
        this.updateSetting(key, picker.value);
      });
    });
    
    const hexTargets = view.querySelectorAll('.hex-target');
    hexTargets.forEach(input => {
      const picker = input.parentElement.querySelector('.color-target');
      
      input.addEventListener('change', () => {
        let val = input.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        
        const hexPattern = /^#[0-9a-fA-F]{6}$/;
        if (hexPattern.test(val)) {
          picker.value = val;
          let key = picker.id.replace('picker-', '');
          if (key === 'btn-a') key = 'buttonColorA';
          if (key === 'btn-b') key = 'buttonColorB';
          if (key === 'joystick') key = 'joystickColor';
          if (key === 'led') key = 'ledColor';
          if (key === 'coin') key = 'coinLightColor';
          
          this.updateSetting(key, val);
        } else {
          // Reset to current draft config
          let key = picker.id.replace('picker-', '');
          if (key === 'btn-a') key = 'buttonColorA';
          if (key === 'btn-b') key = 'buttonColorB';
          if (key === 'joystick') key = 'joystickColor';
          if (key === 'led') key = 'ledColor';
          if (key === 'coin') key = 'coinLightColor';
          input.value = this.draftConfig[key].toUpperCase();
          if (window.ArcadeAudio) window.ArcadeAudio.playWarning();
        }
      });
    });
    
    // Marquee text input
    const marqueeInput = view.querySelector('#input-marquee-text');
    if (marqueeInput) {
      marqueeInput.addEventListener('input', () => {
        let clean = marqueeInput.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').substring(0, 15);
        marqueeInput.value = clean;
        this.updateSetting('marqueeText', clean);
      });
    }
    
    // Filter selectors
    const filterSel = view.querySelector('#select-screen-filter');
    if (filterSel) {
      filterSel.addEventListener('change', () => {
        this.updateSetting('screenFilter', filterSel.value);
      });
    }
    
    // Sliders (Scanlines, Screen glow, Cabinet glow)
    const scanlineSlider = view.querySelector('#range-scanline');
    if (scanlineSlider) {
      scanlineSlider.addEventListener('input', () => {
        const val = parseFloat(scanlineSlider.value);
        scanlineSlider.nextElementSibling.textContent = `${Math.round(val * 100)}%`;
        this.updateSetting('scanlineIntensity', val);
      });
    }
    
    const sgSlider = view.querySelector('#range-screen-glow');
    if (sgSlider) {
      sgSlider.addEventListener('input', () => {
        const val = parseFloat(sgSlider.value);
        sgSlider.nextElementSibling.textContent = `${Math.round(val * 100)}%`;
        this.updateSetting('screenGlow', val);
      });
    }
    
    const cgSlider = view.querySelector('#range-cabinet-glow');
    if (cgSlider) {
      cgSlider.addEventListener('input', () => {
        const val = parseFloat(cgSlider.value);
        cgSlider.nextElementSibling.textContent = `${Math.round(val * 100)}%`;
        this.updateSetting('cabinetGlow', val);
      });
    }
    
    // Footer button click bindings
    view.querySelector('#builder-reset-btn').addEventListener('click', () => {
      window.ArcadeOS.showConfirmModal("Restore chassis configuration back to factory default?", () => {
        this.resetToDefault();
        if (window.ArcadeAudio) window.ArcadeAudio.playSelect();
      });
    });
    
    view.querySelector('#builder-cancel-btn').addEventListener('click', () => {
      this.cancel();
      window.ArcadeOS.goHome();
    });
    
    const applyBtn = view.querySelector('#builder-apply-btn');
    if (applyBtn) {
      applyBtn.classList.toggle('active', this.isDirty());
      applyBtn.addEventListener('click', () => {
        this.apply();
        applyBtn.classList.remove('active');
        if (window.ArcadeAudio) window.ArcadeAudio.playSelect();
        // Return to home screen upon apply
        window.ArcadeOS.goHome();
      });
    }
  }
};

export default ArcadeCustomizer;
