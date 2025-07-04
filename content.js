class MockSyncContent {
  constructor() {
    this.isActive = false;
    this.currentMode = 'text';
    this.wireframeMode = false;
    this.modifications = [];
    this.modificationHistory = [];
    this.historyIndex = -1;
    this.originalElements = new Map();
    this.toolbar = null;
    this.selectedElement = null;
    
    this.init();
  }

  init() {
    this.createToolbar();
    this.bindEvents();
    this.loadState();
    this.injectStyles();
  }

  createToolbar() {
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'mockSync-toolbar';
    this.toolbar.innerHTML = `
      <div class="toolbar-content">
        <div class="toolbar-title">MockSync</div>
        <div class="toolbar-controls">
          <button id="ms-text-btn" class="toolbar-btn active" title="Text Mode">📝</button>
          <button id="ms-image-btn" class="toolbar-btn" title="Image Mode">🖼️</button>
          <button id="ms-ai-btn" class="toolbar-btn" title="AI Mode">🤖</button>
          <button id="ms-undo-btn" class="toolbar-btn" title="Undo">↶</button>
          <button id="ms-redo-btn" class="toolbar-btn" title="Redo">↷</button>
          <button id="ms-reset-btn" class="toolbar-btn" title="Reset">🔄</button>
        </div>
        <button id="ms-close-btn" class="toolbar-close" title="Close">×</button>
      </div>
    `;
    
    document.body.appendChild(this.toolbar);
    this.bindToolbarEvents();
  }

  bindToolbarEvents() {
    document.getElementById('ms-text-btn').addEventListener('click', () => this.setMode('text'));
    document.getElementById('ms-image-btn').addEventListener('click', () => this.setMode('image'));
    document.getElementById('ms-ai-btn').addEventListener('click', () => this.setMode('ai'));
    document.getElementById('ms-undo-btn').addEventListener('click', () => this.undo());
    document.getElementById('ms-redo-btn').addEventListener('click', () => this.redo());
    document.getElementById('ms-reset-btn').addEventListener('click', () => this.reset());
    document.getElementById('ms-close-btn').addEventListener('click', () => this.hideToolbar());
  }

  bindEvents() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
    });

    // Document click handler for element selection
    document.addEventListener('click', (e) => {
      if (this.isActive && !e.target.closest('#mockSync-toolbar')) {
        e.preventDefault();
        this.selectElement(e.target);
      }
    }, true);

    // Hover effects
    document.addEventListener('mouseover', (e) => {
      if (this.isActive && !e.target.closest('#mockSync-toolbar')) {
        this.highlightElement(e.target);
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (this.isActive && !e.target.closest('#mockSync-toolbar')) {
        this.removeHighlight(e.target);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.isActive) {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 'z':
              e.preventDefault();
              if (e.shiftKey) {
                this.redo();
              } else {
                this.undo();
              }
              break;
            case 'r':
              e.preventDefault();
              this.reset();
              break;
          }
        }
      }
    });
  }

  handleMessage(message, sendResponse) {
    switch (message.action) {
      case 'toggleWireframe':
        this.toggleWireframeMode(message.enabled);
        break;
      case 'setMode':
        this.setMode(message.mode);
        break;
      case 'applyAIContent':
        this.applyAIContent(message.content, message.contentType);
        break;
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
        break;
      case 'reset':
        this.reset();
        break;
      case 'exportHTML':
        this.exportHTML();
        break;
      case 'exportCSS':
        this.exportCSS();
        break;
      case 'saveVersion':
        this.saveVersion(message.timestamp);
        break;
    }
    
    if (sendResponse) {
      sendResponse({ success: true });
    }
  }

  toggleWireframeMode(enabled) {
    this.wireframeMode = enabled;
    document.body.classList.toggle('mockSync-wireframe', enabled);
    this.isActive = enabled;
    this.toolbar.style.display = enabled ? 'block' : 'none';
    
    if (enabled) {
      this.showToolbar();
    } else {
      this.hideToolbar();
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    
    // Update toolbar buttons
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`ms-${mode}-btn`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    // Update cursor
    document.body.className = document.body.className.replace(/mockSync-mode-\w+/g, '');
    document.body.classList.add(`mockSync-mode-${mode}`);
  }

  selectElement(element) {
    if (this.selectedElement) {
      this.selectedElement.classList.remove('mockSync-selected');
    }
    
    this.selectedElement = element;
    element.classList.add('mockSync-selected');
    
    this.processElement(element);
  }

  processElement(element) {
    switch (this.currentMode) {
      case 'text':
        this.processTextElement(element);
        break;
      case 'image':
        this.processImageElement(element);
        break;
      case 'ai':
        this.processAIElement(element);
        break;
    }
  }

  processTextElement(element) {
    if (this.isTextElement(element)) {
      const originalText = element.textContent;
      
      if (!this.originalElements.has(element)) {
        this.originalElements.set(element, {
          content: originalText,
          type: 'text'
        });
      }
      
      const placeholderText = this.generatePlaceholderText(element);
      element.textContent = placeholderText;
      element.classList.add('mockSync-modified');
      
      this.addToHistory({
        element: element,
        type: 'text',
        original: originalText,
        modified: placeholderText
      });
    }
  }

  processImageElement(element) {
    if (this.isImageElement(element)) {
      const originalSrc = element.src;
      
      if (!this.originalElements.has(element)) {
        this.originalElements.set(element, {
          content: originalSrc,
          type: 'image'
        });
      }
      
      const placeholderSrc = this.generatePlaceholderImage(element);
      element.src = placeholderSrc;
      element.classList.add('mockSync-modified');
      
      this.addToHistory({
        element: element,
        type: 'image',
        original: originalSrc,
        modified: placeholderSrc
      });
    }
  }

  processAIElement(element) {
    if (this.isTextElement(element)) {
      // This will be handled by the AI content generation from popup
      element.classList.add('mockSync-ai-target');
    }
  }

  applyAIContent(content, contentType) {
    const aiTargets = document.querySelectorAll('.mockSync-ai-target');
    
    aiTargets.forEach(element => {
      const originalText = element.textContent;
      
      if (!this.originalElements.has(element)) {
        this.originalElements.set(element, {
          content: originalText,
          type: 'text'
        });
      }
      
      element.textContent = content;
      element.classList.add('mockSync-modified');
      element.classList.remove('mockSync-ai-target');
      
      this.addToHistory({
        element: element,
        type: 'ai',
        original: originalText,
        modified: content
      });
    });
  }

  isTextElement(element) {
    const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV', 'A', 'BUTTON', 'LABEL'];
    return textTags.includes(element.tagName) && element.textContent.trim().length > 0;
  }

  isImageElement(element) {
    return element.tagName === 'IMG' || 
           (element.tagName === 'DIV' && element.style.backgroundImage) ||
           element.tagName === 'VIDEO';
  }

  generatePlaceholderText(element) {
    const tagName = element.tagName.toLowerCase();
    const textLength = element.textContent.length;
    
    const placeholders = {
      h1: ['Main Headline Here', 'Primary Title', 'Hero Header'],
      h2: ['Section Header', 'Subheading Text', 'Secondary Title'],
      h3: ['Subsection Title', 'Topic Header', 'Content Header'],
      p: textLength > 100 ? 
          ['Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'] :
          ['Sample paragraph text', 'Content description here', 'Placeholder text content'],
      a: ['Link Text', 'Click Here', 'Learn More'],
      button: ['Button Text', 'Click Me', 'Submit'],
      span: ['Inline Text', 'Label', 'Tag'],
      div: textLength > 50 ? 
          ['Content block with multiple lines of text to demonstrate layout'] :
          ['Content Block', 'Text Container']
    };
    
    const options = placeholders[tagName] || ['Placeholder Text'];
    return options[Math.floor(Math.random() * options.length)];
  }

  generatePlaceholderImage(element) {
    const width = element.offsetWidth || 300;
    const height = element.offsetHeight || 200;
    
    // Generate placeholder image URL
    return `https://via.placeholder.com/${width}x${height}/cccccc/666666?text=Placeholder+Image`;
  }

  highlightElement(element) {
    if (!element.classList.contains('mockSync-highlighted')) {
      element.classList.add('mockSync-highlighted');
    }
  }

  removeHighlight(element) {
    element.classList.remove('mockSync-highlighted');
  }

  addToHistory(modification) {
    // Remove any history after current index
    this.modificationHistory = this.modificationHistory.slice(0, this.historyIndex + 1);
    
    // Add new modification
    this.modificationHistory.push(modification);
    this.historyIndex++;
    
    // Limit history size
    if (this.modificationHistory.length > 50) {
      this.modificationHistory.shift();
      this.historyIndex--;
    }
  }

  undo() {
    if (this.historyIndex >= 0) {
      const modification = this.modificationHistory[this.historyIndex];
      
      if (modification.type === 'text') {
        modification.element.textContent = modification.original;
      } else if (modification.type === 'image') {
        modification.element.src = modification.original;
      }
      
      modification.element.classList.remove('mockSync-modified');
      this.historyIndex--;
    }
  }

  redo() {
    if (this.historyIndex < this.modificationHistory.length - 1) {
      this.historyIndex++;
      const modification = this.modificationHistory[this.historyIndex];
      
      if (modification.type === 'text') {
        modification.element.textContent = modification.modified;
      } else if (modification.type === 'image') {
        modification.element.src = modification.modified;
      }
      
      modification.element.classList.add('mockSync-modified');
    }
  }

  reset() {
    this.originalElements.forEach((original, element) => {
      if (original.type === 'text') {
        element.textContent = original.content;
      } else if (original.type === 'image') {
        element.src = original.content;
      }
      
      element.classList.remove('mockSync-modified', 'mockSync-ai-target');
    });
    
    this.originalElements.clear();
    this.modificationHistory = [];
    this.historyIndex = -1;
    
    if (this.selectedElement) {
      this.selectedElement.classList.remove('mockSync-selected');
      this.selectedElement = null;
    }
  }

  showToolbar() {
    this.toolbar.style.display = 'block';
    this.toolbar.classList.add('mockSync-toolbar-visible');
  }

  hideToolbar() {
    this.toolbar.style.display = 'none';
    this.toolbar.classList.remove('mockSync-toolbar-visible');
  }

  exportHTML() {
    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockSync-export-${Date.now()}.html`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  exportCSS() {
    const stylesheets = Array.from(document.styleSheets);
    let css = '';
    
    stylesheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules);
        rules.forEach(rule => {
          css += rule.cssText + '\n';
        });
      } catch (e) {
        // Skip cross-origin stylesheets
      }
    });
    
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockSync-styles-${Date.now()}.css`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  saveVersion(timestamp) {
    const versionData = {
      timestamp: timestamp,
      url: window.location.href,
      modifications: this.modificationHistory,
      html: document.documentElement.outerHTML
    };
    
    chrome.storage.local.set({
      [`mockSync_version_${timestamp}`]: versionData
    });
  }

  loadState() {
    chrome.storage.local.get([`mockSync_${location.href}`], (result) => {
      const state = result[`mockSync_${location.href}`];
      if (state) {
        this.wireframeMode = state.wireframeMode || false;
        this.currentMode = state.currentMode || 'text';
        
        if (this.wireframeMode) {
          this.toggleWireframeMode(true);
        }
      }
    });
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #mockSync-toolbar {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: none;
      }

      .toolbar-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .toolbar-title {
        color: white;
        font-weight: 600;
        font-size: 14px;
      }

      .toolbar-controls {
        display: flex;
        gap: 8px;
      }

      .toolbar-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 6px;
        padding: 8px 10px;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
      }

      .toolbar-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .toolbar-btn.active {
        background: rgba(255, 255, 255, 0.4);
      }

      .toolbar-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        color: white;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toolbar-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .mockSync-wireframe * {
        outline: 1px solid rgba(102, 126, 234, 0.3) !important;
      }

      .mockSync-highlighted {
        outline: 2px solid #667eea !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
      }

      .mockSync-selected {
        outline: 3px solid #764ba2 !important;
        outline-offset: 2px !important;
        position: relative !important;
      }

      .mockSync-modified {
        background: rgba(102, 126, 234, 0.1) !important;
        border-radius: 4px !important;
      }

      .mockSync-ai-target {
        background: rgba(118, 75, 162, 0.1) !important;
        border-radius: 4px !important;
      }

      .mockSync-mode-text * {
        cursor: text !important;
      }

      .mockSync-mode-image img,
      .mockSync-mode-image video {
        cursor: crosshair !important;
      }

      .mockSync-mode-ai * {
        cursor: help !important;
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Initialize MockSync when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MockSyncContent();
  });
} else {
  new MockSyncContent();
}