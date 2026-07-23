// Arcade Machine Customization Module (Phase 3B)
// Handcrafted ES Module for Cabinet Customization & Preset Management

export const ArcadeCustomizer = {
  persistedConfig: null,
  draftConfig: null,
  snapshotConfig: null,
  initialized: false,
  activeCategory: "cabinet",
  presets: [],
  activePresetId: "builtin:graphite",
  
  // History State stack
  history: [],
  historyIndex: -1,
  marqueeTimeoutId: null,
  
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
        if (parsed) {
          if (parsed.config && this.validateConfig(parsed.config)) {
            this.persistedConfig = parsed.config;
          }
          if (Array.isArray(parsed.presets)) {
            this.presets = parsed.presets.filter(p => {
              return p && typeof p === 'object' && p.id && p.name && p.config && this.validateConfig(p.config);
            }).slice(0, 20);
          }
          if (parsed.activePresetId) {
            this.activePresetId = parsed.activePresetId;
          }
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
    if (!chassis || !chassis.style || typeof chassis.style.setProperty !== 'function') return;
    
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
    
    // If setting has changed, adjust dirty active indicator
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
      activePresetId: this.activePresetId,
      config: this.persistedConfig,
      presets: this.presets
    };
    localStorage.setItem('arcade_machine_customization', JSON.stringify(payload));
  },
  
  open(view) {
    if (!this.initialized || !this.persistedConfig) {
      this.init();
    }
    this.snapshotConfig = { ...this.persistedConfig };
    this.draftConfig = { ...this.persistedConfig };
    this.applyConfig(this.draftConfig);
    
    // Initialize history baseline
    this.resetHistory();
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
    this.snapshotConfig = { ...this.persistedConfig };
    
    if (window.ArcadeHardware) {
      window.ArcadeHardware.pulseStorage();
    }
  },
  
  resetToDefault() {
    this.draftConfig = { ...this.DEFAULT_CONFIG };
    this.activePresetId = "builtin:graphite";
    this.applyConfig(this.draftConfig);
    this.pushHistory();
    this.renderBuilderUI(document.getElementById('arcade-app-view'));
  },
  
  loadTheme(themeId) {
    const theme = this.BUILTIN_THEMES[themeId];
    if (theme) {
      this.draftConfig = { ...this.draftConfig, ...theme };
      this.activePresetId = `builtin:${themeId}`;
      this.applyConfig(this.draftConfig);
      this.resetHistory(); // start a clear boundary
      this.renderBuilderUI(document.getElementById('arcade-app-view'));
    }
  },

  // ============================================================================
  // PRESETS MANAGEMENT
  // ============================================================================
  saveUserPreset(name) {
    name = name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().substring(0, 20);
    if (!name) return false;
    
    if (this.presets.length >= 20) {
      return { error: "Maximum limit of 20 user presets reached." };
    }
    
    const presetId = `user:preset_${Date.now()}`;
    const newPreset = {
      id: presetId,
      name: name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: JSON.parse(JSON.stringify(this.draftConfig))
    };
    
    this.presets.push(newPreset);
    this.activePresetId = presetId;
    this.saveToStorage();
    return true;
  },

  duplicatePreset(id) {
    const preset = this.presets.find(p => p.id === id);
    if (!preset) return false;
    
    if (this.presets.length >= 20) {
      return { error: "Maximum limit of 20 user presets reached." };
    }

    const dupPreset = {
      id: `user:preset_${Date.now()}`,
      name: `${preset.name} DUP`.substring(0, 20),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: JSON.parse(JSON.stringify(preset.config))
    };
    
    this.presets.push(dupPreset);
    this.saveToStorage();
    return true;
  },

  renamePreset(id, newName) {
    newName = newName.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().substring(0, 20);
    if (!newName) return false;

    const preset = this.presets.find(p => p.id === id);
    if (preset) {
      preset.name = newName;
      preset.updatedAt = new Date().toISOString();
      this.saveToStorage();
      return true;
    }
    return false;
  },

  overwritePreset(id) {
    const preset = this.presets.find(p => p.id === id);
    if (preset) {
      preset.config = JSON.parse(JSON.stringify(this.draftConfig));
      preset.updatedAt = new Date().toISOString();
      this.saveToStorage();
      return true;
    }
    return false;
  },

  deletePreset(id) {
    const idx = this.presets.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.presets.splice(idx, 1);
      if (this.activePresetId === id) {
        this.activePresetId = "custom";
      }
      this.saveToStorage();
      return true;
    }
    return false;
  },

  loadPreset(id) {
    const preset = this.presets.find(p => p.id === id);
    if (preset) {
      this.draftConfig = JSON.parse(JSON.stringify(preset.config));
      this.activePresetId = id;
      this.applyConfig(this.draftConfig);
      this.resetHistory(); // start a clear boundary
      return true;
    }
    return false;
  },

  // ============================================================================
  // HISTORY STATES (UNDO / REDO)
  // ============================================================================
  resetHistory() {
    this.history = [JSON.parse(JSON.stringify(this.draftConfig))];
    this.historyIndex = 0;
    this.updateUndoRedoButtons();
  },

  pushHistory() {
    const currentStr = JSON.stringify(this.draftConfig);
    if (this.historyIndex >= 0 && JSON.stringify(this.history[this.historyIndex]) === currentStr) {
      return;
    }
    
    // Slice off redo futures
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.parse(currentStr));
    
    if (this.history.length > 20) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
    this.updateUndoRedoButtons();
  },

  canUndo() {
    return this.historyIndex > 0;
  },

  canRedo() {
    return this.historyIndex < this.history.length - 1;
  },

  undo() {
    if (!this.canUndo()) return;
    this.historyIndex--;
    this.draftConfig = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    this.applyConfig(this.draftConfig);
    this.renderBuilderUI(document.getElementById('arcade-app-view'));
  },

  redo() {
    if (!this.canRedo()) return;
    this.historyIndex++;
    this.draftConfig = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    this.applyConfig(this.draftConfig);
    this.renderBuilderUI(document.getElementById('arcade-app-view'));
  },

  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('builder-undo-btn');
    const redoBtn = document.getElementById('builder-redo-btn');
    if (undoBtn) {
      undoBtn.disabled = !this.canUndo();
      undoBtn.classList.toggle('disabled', !this.canUndo());
    }
    if (redoBtn) {
      redoBtn.disabled = !this.canRedo();
      redoBtn.classList.toggle('disabled', !this.canRedo());
    }
  },

  // ============================================================================
  // CURATED RANDOMIZER
  // ============================================================================
  randomize() {
    const premiumColors = [
      "#35d0ba", "#ff365d", "#e60012", "#ffffff", "#1e3a8a", "#f59e0b",
      "#3b82f6", "#d97706", "#7c2d12", "#8b5cf6", "#ec4899", "#a78bfa",
      "#059669", "#ea580c", "#1e1b4b", "#10b981", "#f97316"
    ];
    const allowedFilters = ["standard", "sharp", "warm", "crt-soft", "crt-strong", "mono-green", "mono-amber"];
    const allowedFinishes = ["anodized", "matte", "metallic", "textured"];
    const allowedSideArt = ["none", "lines", "stripes", "grid", "waves", "circuit"];
    const allowedThemes = ["graphite", "red", "blue", "cream", "violet", "forest", "copper", "mono"];
    
    // Curated randomization to prevent unreadable clashing contrasts
    const accent = premiumColors[Math.floor(Math.random() * premiumColors.length)];
    let secondary = premiumColors[Math.floor(Math.random() * premiumColors.length)];
    while (secondary === accent) {
      secondary = premiumColors[Math.floor(Math.random() * premiumColors.length)];
    }
    
    this.draftConfig.chassisTheme = allowedThemes[Math.floor(Math.random() * allowedThemes.length)];
    this.draftConfig.accentColor = accent;
    this.draftConfig.secondaryColor = secondary;
    this.draftConfig.buttonColorA = premiumColors[Math.floor(Math.random() * premiumColors.length)];
    this.draftConfig.buttonColorB = premiumColors[Math.floor(Math.random() * premiumColors.length)];
    this.draftConfig.joystickColor = ["#151515", "#ffffff", "#111827", "#d97706", "#1f2937"][Math.floor(Math.random() * 5)];
    this.draftConfig.ledColor = accent;
    this.draftConfig.coinLightColor = secondary;
    this.draftConfig.screenFilter = allowedFilters[Math.floor(Math.random() * allowedFilters.length)];
    this.draftConfig.sideArt = allowedSideArt[Math.floor(Math.random() * allowedSideArt.length)];
    this.draftConfig.hardwareFinish = allowedFinishes[Math.floor(Math.random() * allowedFinishes.length)];
    this.draftConfig.scanlineIntensity = parseFloat((Math.random() * 0.5 + 0.1).toFixed(2));
    this.draftConfig.screenGlow = parseFloat((Math.random() * 0.6 + 0.2).toFixed(2));
    this.draftConfig.cabinetGlow = parseFloat((Math.random() * 0.6 + 0.2).toFixed(2));
    
    this.activePresetId = "custom";
    this.applyConfig(this.draftConfig);
    this.pushHistory();
    this.renderBuilderUI(document.getElementById('arcade-app-view'));
  },

  // ============================================================================
  // CONTRAST AUDIT HELPERS
  // ============================================================================
  checkContrast() {
    const warnings = [];
    const ledLuma = this.getLuminance(this.draftConfig.ledColor);
    
    if (ledLuma < 40) {
      warnings.push("Status LEDs are too dark. OLED text might be unreadable.");
    }
    
    const btnALuma = this.getLuminance(this.draftConfig.buttonColorA);
    if (btnALuma > 220) {
      warnings.push("Button A color is too bright. Plunger label might clash.");
    }
    
    const btnBLuma = this.getLuminance(this.draftConfig.buttonColorB);
    if (btnBLuma > 220) {
      warnings.push("Button B color is too bright. Plunger label might clash.");
    }
    
    return warnings;
  },
  
  getLuminance(hex) {
    const c = hex.replace('#', '');
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  // ============================================================================
  // IMPORT / EXPORT WORKFLOWS
  // ============================================================================
  exportConfig() {
    const activeName = this.activePresetId.startsWith('user:')
      ? (this.presets.find(p => p.id === this.activePresetId)?.name || 'User Preset')
      : (this.activePresetId.startsWith('builtin:') ? this.BUILTIN_THEMES[this.activePresetId.split(':')[1]]?.name : 'Custom Config');
      
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      presetName: activeName,
      config: this.draftConfig
    };
    
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arcade-config-${activeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importConfig(file) {
    if (!file) return;
    
    if (file.size > 64 * 1024) {
      this.showImportError("Import rejected: File size exceeds 64 KB limit.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        if (!payload || typeof payload !== 'object' || payload.schemaVersion !== 1) {
          throw new Error("Invalid schemaVersion or payload shape.");
        }
        
        if (!payload.config || !this.validateConfig(payload.config)) {
          throw new Error("Configuration properties validation failed.");
        }
        
        // Show diff check dialog
        this.showDiffSummaryModal(payload.config);
      } catch (err) {
        console.error(err);
        this.showImportError(`Import Failed: ${err.message || 'Malformed JSON config file.'}`);
      }
    };
    reader.readAsText(file);
  },

  showImportError(msg) {
    const view = document.getElementById('arcade-app-view');
    let errHud = document.getElementById('builder-import-err');
    if (!errHud) {
      errHud = document.createElement('div');
      errHud.id = 'builder-import-err';
      errHud.className = 'import-err-msg';
      errHud.setAttribute('aria-live', 'polite');
      view.appendChild(errHud);
    }
    errHud.textContent = msg;
    if (window.ArcadeAudio) window.ArcadeAudio.playWarning();
    setTimeout(() => { if (errHud) errHud.remove(); }, 4000);
  },

  showDiffSummaryModal(importedConfig) {
    const changes = [];
    const active = this.draftConfig;
    
    const keysToCheck = [
      { key: "chassisTheme", label: "Theme" },
      { key: "accentColor", label: "Accent Color" },
      { key: "secondaryColor", label: "Secondary Color" },
      { key: "marqueeText", label: "Marquee Header" },
      { key: "buttonColorA", label: "Button A" },
      { key: "buttonColorB", label: "Button B" },
      { key: "joystickColor", label: "Joystick" },
      { key: "ledColor", label: "Status LED" },
      { key: "screenFilter", label: "CRT Filter" },
      { key: "scanlineIntensity", label: "Scanlines" },
      { key: "screenGlow", label: "Screen Glow" },
      { key: "cabinetGlow", label: "Cabinet Glow" },
      { key: "sideArt", label: "Side Decal" },
      { key: "hardwareFinish", label: "Finish" }
    ];

    keysToCheck.forEach(item => {
      if (active[item.key] !== importedConfig[item.key]) {
        changes.push({
          label: item.label,
          old: active[item.key],
          new: importedConfig[item.key]
        });
      }
    });

    let diffModal = document.getElementById('builder-import-diff-modal');
    if (!diffModal) {
      diffModal = document.createElement('div');
      diffModal.id = 'builder-import-diff-modal';
      diffModal.className = 'confirm-modal active';
      document.body.appendChild(diffModal);
    }
    
    diffModal.innerHTML = `
      <div class="confirm-modal-box diff-modal-box" style="width: 290px;">
        <h3 style="font-size: 11px; margin-top: 0; color: var(--machine-accent, #35d0ba);">IMPORT CONFIG PREVIEW</h3>
        <div class="diff-content" style="max-height: 120px; overflow-y: auto; text-align: left; font-size: 9px; margin: 12px 0; border: 1px dashed rgba(255,255,255,0.1); padding: 8px;">
          ${changes.length === 0 ? '<div style="text-align:center;">No changes detected.</div>' : 
            changes.map(ch => `
              <div style="margin-bottom: 4px;">
                <strong>${ch.label}:</strong> <span style="opacity:0.5;">${ch.old}</span> &rarr; <span style="color:var(--machine-accent, #35d0ba);">${ch.new}</span>
              </div>
            `).join('')}
        </div>
        <div class="confirm-actions">
          <button id="import-apply-btn" class="sys-btn active-btn ${changes.length === 0 ? '' : 'active'}">APPLY</button>
          <button id="import-cancel-btn" class="sys-btn">CANCEL</button>
        </div>
      </div>
    `;

    diffModal.querySelector('#import-cancel-btn').addEventListener('click', () => {
      diffModal.remove();
      if (window.ArcadeAudio) window.ArcadeAudio.playBack();
    });

    diffModal.querySelector('#import-apply-btn').addEventListener('click', () => {
      if (changes.length > 0) {
        this.draftConfig = { ...this.draftConfig, ...importedConfig };
        this.activePresetId = "custom";
        this.applyConfig(this.draftConfig);
        this.pushHistory();
        this.renderBuilderUI(document.getElementById('arcade-app-view'));
      }
      diffModal.remove();
      if (window.ArcadeAudio) window.ArcadeAudio.playSelect();
    });
  },

  // ============================================================================
  // RESET SECTION
  // ============================================================================
  resetSection() {
    const defaults = this.DEFAULT_CONFIG;
    const cat = this.activeCategory;
    
    const keysMap = {
      cabinet: ["chassisTheme", "hardwareFinish"],
      colors: ["accentColor", "secondaryColor"],
      marquee: ["marqueeText"],
      controls: ["buttonColorA", "buttonColorB", "joystickColor"],
      screen: ["screenFilter", "scanlineIntensity"],
      lighting: ["ledColor", "coinLightColor", "screenGlow", "cabinetGlow"]
    };
    
    const keys = keysMap[cat] || [];
    keys.forEach(k => {
      this.draftConfig[k] = defaults[k];
    });
    
    this.applyConfig(this.draftConfig);
    this.pushHistory();
    this.renderBuilderUI(document.getElementById('arcade-app-view'));
  },

  // ============================================================================
  // UI RENDERERS
  // ============================================================================
  renderBuilderUI(view) {
    if (!view) return;
    
    const categories = [
      { id: "cabinet", label: "Cabinet" },
      { id: "colors", label: "Colors" },
      { id: "marquee", label: "Marquee" },
      { id: "controls", label: "Controls" },
      { id: "screen", label: "Screen" },
      { id: "lighting", label: "Lighting" },
      { id: "presets", label: "Presets" },
      { id: "import-export", label: "Import/Export" }
    ];
    
    const warnings = this.checkContrast();
    
    view.innerHTML = `
      <div class="sys-app customizer-app">
        <div class="sys-header">
          <h2>MACHINE BUILDER</h2>
          <button class="sys-back-btn" id="builder-back-btn" data-arcade-focusable data-arcade-action="back">BACK (ESC)</button>
        </div>
        
        <div class="builder-layout">
          <!-- Left Categories Tabs Horizontal scrollable Horizontal Horizontal Horizontal horizontal -->
          <div class="builder-nav-tabs">
            ${categories.map(cat => `
              <button class="builder-tab-btn ${cat.id === this.activeCategory ? 'active' : ''}" data-cat-id="${cat.id}" data-arcade-focusable data-arcade-action="tab" data-arcade-value="${cat.id}">
                ${cat.label.toUpperCase()}
              </button>
            `).join('')}
          </div>
          
          <!-- Right Properties Controls Panel -->
          <div class="builder-panel" id="builder-controls-panel">
            ${warnings.length > 0 ? `
              <div class="contrast-warning-banner" style="background: rgba(217, 119, 6, 0.15); border: 1px solid #d97706; padding: 6px 10px; border-radius: 4px; font-size: 8px; color: #fbbf24; margin-bottom: 4px;">
                ⚠️ CONTRAST WARNING: ${warnings[0]}
              </div>
            ` : ''}
            ${this.renderActiveCategoryControls()}
          </div>
        </div>
        
        <!-- Bottom Action Bar containing Undo/Redo/Randomize/Cancel/Apply -->
        <div class="builder-actions-bar">
          <div class="actions-left" style="display:flex; gap:6px;">
            <button id="builder-reset-btn" class="sys-btn" title="Reset Current Section" data-arcade-focusable data-arcade-action="reset">RESET SECTION</button>
            <button id="builder-undo-btn" class="sys-btn" title="Undo Last Action" data-arcade-focusable data-arcade-action="undo">UNDO</button>
            <button id="builder-redo-btn" class="sys-btn" title="Redo Last Action" data-arcade-focusable data-arcade-action="redo">REDO</button>
          </div>
          <div class="actions-right">
            <button id="builder-randomize-btn" class="sys-btn" style="border-color: #a78bfa; color: #a78bfa;" title="Generate Curated Variant" data-arcade-focusable data-arcade-action="randomize">RANDOMIZE</button>
            <button id="builder-cancel-btn" class="sys-btn" data-arcade-focusable data-arcade-action="cancel">CANCEL</button>
            <button id="builder-apply-btn" class="sys-btn active-btn" data-arcade-focusable data-arcade-action="apply">APPLY</button>
          </div>
        </div>
      </div>
    `;
    
    this.bindEvents(view);
    this.updateUndoRedoButtons();
    if (window.ArcadeSystemUI) {
      window.ArcadeSystemUI.refreshFocusableElements();
      window.ArcadeSystemUI.focusFirst();
    }
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
              <button class="theme-swatch-btn ${cfg.chassisTheme === t ? 'active' : ''}" data-theme-id="${t}" data-arcade-focusable data-arcade-action="theme" data-arcade-value="${t}">
                ${this.BUILTIN_THEMES[t].name}
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="controls-group">
          <h3>HARDWARE FINISH</h3>
          <select id="select-hardware-finish" class="sys-input" data-arcade-focusable data-arcade-control="select">
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
            <input type="color" id="picker-accent" value="${cfg.accentColor}" class="sys-input color-target" data-arcade-focusable data-arcade-control="color">
            <input type="text" id="hex-accent" value="${cfg.accentColor.toUpperCase()}" class="sys-input hex-target" maxLength="7" data-arcade-focusable data-arcade-control="text" data-arcade-value="hex-accent">
          </div>
          <div class="setting-item">
            <label for="picker-secondary">Secondary color</label>
            <input type="color" id="picker-secondary" value="${cfg.secondaryColor}" class="sys-input color-target" data-arcade-focusable data-arcade-control="color">
            <input type="text" id="hex-secondary" value="${cfg.secondaryColor.toUpperCase()}" class="sys-input hex-target" maxLength="7" data-arcade-focusable data-arcade-control="text" data-arcade-value="hex-secondary">
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
            <input type="text" id="input-marquee-text" value="${cfg.marqueeText}" class="sys-input" maxLength="15" data-arcade-focusable data-arcade-control="text" data-arcade-value="marquee-text">
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
            <input type="color" id="picker-btn-a" value="${cfg.buttonColorA}" class="sys-input color-target" data-arcade-focusable data-arcade-control="color">
            <input type="text" id="hex-btn-a" value="${cfg.buttonColorA.toUpperCase()}" class="sys-input hex-target" maxLength="7" data-arcade-focusable data-arcade-control="text" data-arcade-value="hex-btn-a">
          </div>
          <div class="setting-item">
            <label for="picker-btn-b">Action Button B</label>
            <input type="color" id="picker-btn-b" value="${cfg.buttonColorB}" class="sys-input color-target" data-arcade-focusable data-arcade-control="color">
            <input type="text" id="hex-btn-b" value="${cfg.buttonColorB.toUpperCase()}" class="sys-input hex-target" maxLength="7" data-arcade-focusable data-arcade-control="text" data-arcade-value="hex-btn-b">
          </div>
          <div class="setting-item">
            <label for="picker-joystick">Joystick Ball</label>
            <input type="color" id="picker-joystick" value="${cfg.joystickColor}" class="sys-input color-target" data-arcade-focusable data-arcade-control="color">
            <input type="text" id="hex-joystick" value="${cfg.joystickColor.toUpperCase()}" class="sys-input hex-target" maxLength="7" data-arcade-focusable data-arcade-control="text" data-arcade-value="hex-joystick">
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
            <select id="select-screen-filter" class="sys-input" data-arcade-focusable data-arcade-control="select">
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
            <input type="range" id="range-scanline" min="0.0" max="0.8" step="0.05" value="${cfg.scanlineIntensity}" data-arcade-focusable data-arcade-control="range" data-arcade-value="scanline-intensity">
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
            <input type="color" id="picker-led" value="${cfg.ledColor}" class="sys-input color-target" data-arcade-focusable data-arcade-control="color">
            <input type="text" id="hex-led" value="${cfg.ledColor.toUpperCase()}" class="sys-input hex-target" maxLength="7" data-arcade-focusable data-arcade-control="text" data-arcade-value="hex-led">
          </div>
          <div class="setting-item">
            <label for="picker-coin">Coin Slot LED</label>
            <input type="color" id="picker-coin" value="${cfg.coinLightColor}" class="sys-input color-target" data-arcade-focusable data-arcade-control="color">
            <input type="text" id="hex-coin" value="${cfg.coinLightColor.toUpperCase()}" class="sys-input hex-target" maxLength="7" data-arcade-focusable data-arcade-control="text" data-arcade-value="hex-coin">
          </div>
          <div class="setting-item">
            <label for="range-screen-glow">Screen Glow</label>
            <input type="range" id="range-screen-glow" min="0.0" max="1.0" step="0.05" value="${cfg.screenGlow}" data-arcade-focusable data-arcade-control="range" data-arcade-value="screen-glow">
            <span>${Math.round(cfg.screenGlow * 100)}%</span>
          </div>
          <div class="setting-item">
            <label for="range-cabinet-glow">Cabinet Ambient Glow</label>
            <input type="range" id="range-cabinet-glow" min="0.0" max="1.0" step="0.05" value="${cfg.cabinetGlow}" data-arcade-focusable data-arcade-control="range" data-arcade-value="cabinet-glow">
            <span>${Math.round(cfg.cabinetGlow * 100)}%</span>
          </div>
        </div>
      `;
    }
    
    if (this.activeCategory === "presets") {
      return `
        <div class="controls-group">
          <h3>SAVE DRAFT TO USER PRESET</h3>
          <div class="setting-item" style="display:flex; gap:8px;">
            <input type="text" id="input-preset-name" placeholder="PRESET NAME" class="sys-input" maxLength="20" style="flex:1;" data-arcade-focusable data-arcade-control="text" data-arcade-value="preset-name">
            <button id="btn-save-preset" class="sys-btn active-btn active" style="margin:0;" data-arcade-focusable data-arcade-action="save-preset">SAVE NEW</button>
          </div>
        </div>
        
        <div class="controls-group" style="margin-top:8px;">
          <h3>MANAGE SAVED USER PRESETS (${this.presets.length}/20)</h3>
          ${this.presets.length === 0 ? '<div style="font-size:9px; opacity:0.6; padding:8px 0;">No saved presets yet. Name your current setup above, then choose Save New.</div>' : `
            <div class="presets-list" style="display:flex; flex-direction:column; gap:6px; max-height:110px; overflow-y:auto;">
              ${this.presets.map(p => `
                <div class="preset-item-card ${this.activePresetId === p.id ? 'active' : ''}" style="display:flex; align-items:center; justify-content:space-between; background:#1b1b21; border:1px solid rgba(255,255,255,0.06); padding:6px; border-radius:4px;" data-preset-id="${p.id}">
                  <span class="preset-item-name" style="font-weight:bold; font-size:9px;">${p.name}</span>
                  <div style="display:flex; gap:4px;">
                    <button class="preset-load-btn sys-btn" style="font-size:7px; padding:3px 6px;" data-arcade-focusable data-arcade-action="load-preset" data-arcade-value="${p.id}">LOAD</button>
                    <button class="preset-dup-btn sys-btn" style="font-size:7px; padding:3px 6px;" data-arcade-focusable data-arcade-action="dup-preset" data-arcade-value="${p.id}">DUP</button>
                    <button class="preset-del-btn sys-btn danger-btn" style="font-size:7px; padding:3px 6px; border-color:#ef4444; color:#ef4444;" data-arcade-focusable data-arcade-action="del-preset" data-arcade-value="${p.id}">DEL</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    }
    
    if (this.activeCategory === "import-export") {
      const activeName = this.activePresetId.startsWith('user:')
        ? (this.presets.find(p => p.id === this.activePresetId)?.name || 'User Preset')
        : (this.activePresetId.startsWith('builtin:') ? this.BUILTIN_THEMES[this.activePresetId.split(':')[1]]?.name : 'Custom Config');
        
      return `
        <div class="controls-group">
          <h3>EXPORT CONFIG</h3>
          <p style="font-size:9px; opacity:0.5; margin:0 0 6px 0;">Active profile config: <strong>${activeName}</strong></p>
          <button id="btn-export-config" class="sys-btn active-btn active" style="width:100%; margin:0;" data-arcade-focusable data-arcade-action="export-config">DOWNLOAD CONFIG (JSON)</button>
        </div>
        
        <div class="controls-group" style="margin-top:12px;">
          <h3>IMPORT CONFIG</h3>
          <p style="font-size:9px; opacity:0.5; margin:0 0 6px 0;">Select a configuration file (.json) to import into the builder draft.</p>
          <input type="file" id="import-file-input" accept=".json" style="display:none;">
          <button id="btn-trigger-import" class="sys-btn" style="width:100%; margin:0;" data-arcade-focusable data-arcade-action="import-config">CHOOSE FILE</button>
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
        this.pushHistory();
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

      picker.addEventListener('change', () => {
        this.pushHistory(); // push to history on release
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
          this.pushHistory();
        } else {
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
    
    // Marquee text input (debounced history snapshot)
    const marqueeInput = view.querySelector('#input-marquee-text');
    if (marqueeInput) {
      marqueeInput.addEventListener('input', () => {
        let clean = marqueeInput.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').substring(0, 15);
        marqueeInput.value = clean;
        this.updateSetting('marqueeText', clean);
        
        if (this.marqueeTimeoutId) clearTimeout(this.marqueeTimeoutId);
        this.marqueeTimeoutId = setTimeout(() => {
          this.pushHistory();
        }, 500);
      });
    }
    
    // Filter selectors
    const filterSel = view.querySelector('#select-screen-filter');
    if (filterSel) {
      filterSel.addEventListener('change', () => {
        this.updateSetting('screenFilter', filterSel.value);
        this.pushHistory();
      });
    }
    
    // Sliders
    const scanlineSlider = view.querySelector('#range-scanline');
    if (scanlineSlider) {
      scanlineSlider.addEventListener('input', () => {
        const val = parseFloat(scanlineSlider.value);
        scanlineSlider.nextElementSibling.textContent = `${Math.round(val * 100)}%`;
        this.updateSetting('scanlineIntensity', val);
      });
      scanlineSlider.addEventListener('change', () => this.pushHistory());
    }
    
    const sgSlider = view.querySelector('#range-screen-glow');
    if (sgSlider) {
      sgSlider.addEventListener('input', () => {
        const val = parseFloat(sgSlider.value);
        sgSlider.nextElementSibling.textContent = `${Math.round(val * 100)}%`;
        this.updateSetting('screenGlow', val);
      });
      sgSlider.addEventListener('change', () => this.pushHistory());
    }
    
    const cgSlider = view.querySelector('#range-cabinet-glow');
    if (cgSlider) {
      cgSlider.addEventListener('input', () => {
        const val = parseFloat(cgSlider.value);
        cgSlider.nextElementSibling.textContent = `${Math.round(val * 100)}%`;
        this.updateSetting('cabinetGlow', val);
      });
      cgSlider.addEventListener('change', () => this.pushHistory());
    }
    
    // Presets actions triggers
    const btnSavePreset = view.querySelector('#btn-save-preset');
    if (btnSavePreset) {
      btnSavePreset.addEventListener('click', () => {
        const nameInput = view.querySelector('#input-preset-name');
        const res = this.saveUserPreset(nameInput.value);
        if (res === true) {
          nameInput.value = '';
          this.renderBuilderUI(view);
          if (window.ArcadeAudio) window.ArcadeAudio.playSelect();
        } else if (res && res.error) {
          this.showImportError(res.error);
        }
      });
    }
    
    view.querySelectorAll('.preset-item-card').forEach(card => {
      const pid = card.getAttribute('data-preset-id');
      
      card.querySelector('.preset-load-btn').addEventListener('click', () => {
        this.loadPreset(pid);
        this.renderBuilderUI(view);
        if (window.ArcadeAudio) window.ArcadeAudio.playSelect();
      });
      
      card.querySelector('.preset-dup-btn').addEventListener('click', () => {
        const res = this.duplicatePreset(pid);
        if (res === true) {
          this.renderBuilderUI(view);
          if (window.ArcadeAudio) window.ArcadeAudio.playSelect();
        } else if (res && res.error) {
          this.showImportError(res.error);
        }
      });
      
      card.querySelector('.preset-del-btn').addEventListener('click', () => {
        window.ArcadeOS.showConfirmModal("Are you sure you want to delete this custom user preset?", () => {
          this.deletePreset(pid);
          this.renderBuilderUI(view);
          if (window.ArcadeAudio) window.ArcadeAudio.playSelect();
        });
      });
    });
    
    // Import / Export trigger bindings
    const btnExport = view.querySelector('#btn-export-config');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        this.exportConfig();
        if (window.ArcadeAudio) window.ArcadeAudio.playSelect();
      });
    }
    
    const btnTriggerImport = view.querySelector('#btn-trigger-import');
    const importFileInput = view.querySelector('#import-file-input');
    if (btnTriggerImport && importFileInput) {
      btnTriggerImport.addEventListener('click', () => {
        importFileInput.click();
      });
      importFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.importConfig(e.target.files[0]);
          // Reset file input value so it can be re-imported
          importFileInput.value = '';
        }
      });
    }
    
    // Bottom actions footer click bindings
    view.querySelector('#builder-reset-btn').addEventListener('click', () => {
      this.resetSection();
      if (window.ArcadeAudio) window.ArcadeAudio.playSelect();
    });

    view.querySelector('#builder-undo-btn').addEventListener('click', () => {
      this.undo();
      if (window.ArcadeAudio) window.ArcadeAudio.playTick();
    });

    view.querySelector('#builder-redo-btn').addEventListener('click', () => {
      this.redo();
      if (window.ArcadeAudio) window.ArcadeAudio.playTick();
    });

    view.querySelector('#builder-randomize-btn').addEventListener('click', () => {
      this.randomize();
      if (window.ArcadeAudio) window.ArcadeAudio.playSelect();
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
        window.ArcadeOS.goHome();
      });
    }
  }
};

export default ArcadeCustomizer;
