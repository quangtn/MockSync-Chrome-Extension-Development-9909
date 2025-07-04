class MockSyncPopup {
  constructor() {
    this.currentMode = 'text';
    this.modificationCount = 0;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadState();
    this.updateUI();
  }

  bindEvents() {
    // Wireframe mode toggle
    document.getElementById('wireframeMode').addEventListener('change', (e) => {
      this.toggleWireframeMode(e.target.checked);
    });

    // Mode buttons
    document.getElementById('textMode').addEventListener('click', () => {
      this.setMode('text');
    });

    document.getElementById('imageMode').addEventListener('click', () => {
      this.setMode('image');
    });

    document.getElementById('aiMode').addEventListener('click', () => {
      this.setMode('ai');
    });

    document.getElementById('exportMode').addEventListener('click', () => {
      this.setMode('export');
    });

    // AI content generation
    document.getElementById('generateContent').addEventListener('click', () => {
      this.generateAIContent();
    });

    // History controls
    document.getElementById('undoBtn').addEventListener('click', () => {
      this.sendMessage({ action: 'undo' });
    });

    document.getElementById('redoBtn').addEventListener('click', () => {
      this.sendMessage({ action: 'redo' });
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetPage();
    });

    // Export controls
    document.getElementById('exportHtml').addEventListener('click', () => {
      this.exportHTML();
    });

    document.getElementById('exportCss').addEventListener('click', () => {
      this.exportCSS();
    });

    document.getElementById('saveVersion').addEventListener('click', () => {
      this.saveVersion();
    });
  }

  async loadState() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await chrome.storage.local.get([`mockSync_${tab.id}`]);
      const state = result[`mockSync_${tab.id}`] || {};
      
      this.modificationCount = state.modificationCount || 0;
      document.getElementById('wireframeMode').checked = state.wireframeMode || false;
      
      this.updateModificationCount();
    } catch (error) {
      console.error('Error loading state:', error);
    }
  }

  async saveState(updates) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const key = `mockSync_${tab.id}`;
      const result = await chrome.storage.local.get([key]);
      const currentState = result[key] || {};
      
      const newState = { ...currentState, ...updates };
      await chrome.storage.local.set({ [key]: newState });
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  toggleWireframeMode(enabled) {
    this.sendMessage({ 
      action: 'toggleWireframe', 
      enabled: enabled 
    });
    this.saveState({ wireframeMode: enabled });
    this.updateStatus(enabled ? 'Wireframe mode enabled' : 'Wireframe mode disabled');
  }

  setMode(mode) {
    this.currentMode = mode;
    this.updateUI();
    this.sendMessage({ action: 'setMode', mode: mode });
    this.updateStatus(`${mode.charAt(0).toUpperCase() + mode.slice(1)} mode activated`);
  }

  updateUI() {
    // Update active button
    document.querySelectorAll('.control-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`${this.currentMode}Mode`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    // Show/hide sections
    document.querySelectorAll('.ai-section, .export-section').forEach(section => {
      section.classList.remove('active');
    });

    if (this.currentMode === 'ai') {
      document.getElementById('aiSection').classList.add('active');
    } else if (this.currentMode === 'export') {
      document.getElementById('exportSection').classList.add('active');
    }
  }

  async generateAIContent() {
    const contentType = document.getElementById('contentType').value;
    const toneStyle = document.getElementById('toneStyle').value;
    const language = document.getElementById('language').value;

    this.updateStatus('Generating AI content...');

    try {
      const response = await this.callAIAPI({
        contentType,
        toneStyle,
        language
      });

      this.sendMessage({
        action: 'applyAIContent',
        content: response.content,
        contentType: contentType
      });

      this.modificationCount++;
      this.updateModificationCount();
      this.saveState({ modificationCount: this.modificationCount });
      this.updateStatus('AI content generated successfully');
    } catch (error) {
      console.error('AI generation error:', error);
      this.updateStatus('Error generating AI content');
    }
  }

  async callAIAPI(params) {
    // Mock AI API call - replace with actual AI service
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockContent = this.generateMockContent(params);
        resolve({ content: mockContent });
      }, 1000);
    });
  }

  generateMockContent(params) {
    const { contentType, toneStyle, language } = params;
    
    const mockContent = {
      headline: {
        professional: "Innovative Solutions for Modern Challenges",
        casual: "Cool Stuff That Actually Works",
        friendly: "We're Here to Help You Succeed",
        technical: "Advanced Implementation Strategies",
        creative: "Unleash Your Potential Today"
      },
      body: {
        professional: "Our comprehensive approach ensures optimal results through strategic implementation and continuous optimization.",
        casual: "We make things simple and fun. No complicated stuff, just results that matter.",
        friendly: "Let's work together to make your vision a reality. We're excited to help you succeed!",
        technical: "Utilizing advanced algorithms and robust architecture to deliver scalable solutions.",
        creative: "Imagine the possibilities when innovation meets inspiration. Your journey starts here."
      },
      cta: {
        professional: "Contact Us Today",
        casual: "Let's Do This!",
        friendly: "Get Started Now",
        technical: "Initialize Process",
        creative: "Begin Your Journey"
      },
      description: {
        professional: "A comprehensive solution designed to meet your specific requirements and exceed expectations.",
        casual: "The perfect tool for getting things done without the hassle.",
        friendly: "Everything you need to succeed, all in one place.",
        technical: "High-performance system with advanced features and robust security.",
        creative: "Where imagination meets reality in perfect harmony."
      }
    };

    return mockContent[contentType][toneStyle] || "Generated content placeholder";
  }

  resetPage() {
    if (confirm('Are you sure you want to reset all modifications?')) {
      this.sendMessage({ action: 'reset' });
      this.modificationCount = 0;
      this.updateModificationCount();
      this.saveState({ modificationCount: 0 });
      this.updateStatus('Page reset successfully');
    }
  }

  async exportHTML() {
    this.sendMessage({ action: 'exportHTML' });
    this.updateStatus('HTML exported to downloads');
  }

  async exportCSS() {
    this.sendMessage({ action: 'exportCSS' });
    this.updateStatus('CSS exported to downloads');
  }

  async saveVersion() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.sendMessage({ action: 'saveVersion', timestamp });
    this.updateStatus(`Version saved: ${timestamp}`);
  }

  updateModificationCount() {
    document.getElementById('modificationCount').textContent = 
      `${this.modificationCount} modification${this.modificationCount !== 1 ? 's' : ''}`;
  }

  updateStatus(message) {
    document.getElementById('statusText').textContent = message;
    setTimeout(() => {
      document.getElementById('statusText').textContent = 'Ready';
    }, 3000);
  }

  async sendMessage(message) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MockSyncPopup();
});