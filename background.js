class MockSyncBackground {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupContextMenus();
  }

  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.onInstall();
      } else if (details.reason === 'update') {
        this.onUpdate(details.previousVersion);
      }
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.onTabComplete(tabId, tab);
      }
    });

    // Handle tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.cleanupTabData(tabId);
    });

    // Handle messages from content script and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });

    // Handle browser action click
    chrome.action.onClicked.addListener((tab) => {
      this.toggleMockSync(tab);
    });
  }

  setupContextMenus() {
    chrome.contextMenus.create({
      id: 'mockSync-toggle',
      title: 'Toggle MockSync',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'mockSync-text-mode',
      title: 'Text Mode',
      contexts: ['selection'],
      parentId: 'mockSync-toggle'
    });

    chrome.contextMenus.create({
      id: 'mockSync-image-mode',
      title: 'Image Mode',
      contexts: ['image'],
      parentId: 'mockSync-toggle'
    });

    chrome.contextMenus.create({
      id: 'mockSync-ai-mode',
      title: 'AI Mode',
      contexts: ['page'],
      parentId: 'mockSync-toggle'
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  onInstall() {
    console.log('MockSync installed successfully');
    
    // Set default settings
    chrome.storage.sync.set({
      mockSyncSettings: {
        autoActivate: false,
        defaultMode: 'text',
        aiProvider: 'mock',
        exportFormat: 'html',
        version: chrome.runtime.getManifest().version
      }
    });

    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  }

  onUpdate(previousVersion) {
    console.log(`MockSync updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
    
    // Handle version-specific updates
    this.migrateData(previousVersion);
  }

  onTabComplete(tabId, tab) {
    // Initialize tab state if needed
    chrome.storage.local.get([`mockSync_${tabId}`], (result) => {
      if (!result[`mockSync_${tabId}`]) {
        chrome.storage.local.set({
          [`mockSync_${tabId}`]: {
            url: tab.url,
            active: false,
            mode: 'text',
            modifications: [],
            created: Date.now()
          }
        });
      }
    });
  }

  cleanupTabData(tabId) {
    // Clean up storage for closed tabs
    chrome.storage.local.remove([`mockSync_${tabId}`]);
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'getTabState':
        this.getTabState(sender.tab.id, sendResponse);
        break;
      case 'saveTabState':
        this.saveTabState(sender.tab.id, message.state, sendResponse);
        break;
      case 'exportData':
        this.exportData(message.data, sendResponse);
        break;
      case 'generateAIContent':
        this.generateAIContent(message.params, sendResponse);
        break;
      case 'logError':
        this.logError(message.error, sender);
        break;
      default:
        sendResponse({ error: 'Unknown action' });
    }
    
    return true; // Keep message channel open for async response
  }

  handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'mockSync-toggle':
        this.toggleMockSync(tab);
        break;
      case 'mockSync-text-mode':
        this.setMode(tab, 'text');
        break;
      case 'mockSync-image-mode':
        this.setMode(tab, 'image');
        break;
      case 'mockSync-ai-mode':
        this.setMode(tab, 'ai');
        break;
    }
  }

  async toggleMockSync(tab) {
    try {
      const result = await chrome.storage.local.get([`mockSync_${tab.id}`]);
      const tabState = result[`mockSync_${tab.id}`] || {};
      
      const newState = !tabState.active;
      
      await chrome.tabs.sendMessage(tab.id, {
        action: 'toggleWireframe',
        enabled: newState
      });
      
      await chrome.storage.local.set({
        [`mockSync_${tab.id}`]: {
          ...tabState,
          active: newState
        }
      });
    } catch (error) {
      console.error('Error toggling MockSync:', error);
    }
  }

  async setMode(tab, mode) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'setMode',
        mode: mode
      });
    } catch (error) {
      console.error('Error setting mode:', error);
    }
  }

  getTabState(tabId, sendResponse) {
    chrome.storage.local.get([`mockSync_${tabId}`], (result) => {
      const tabState = result[`mockSync_${tabId}`] || {};
      sendResponse({ state: tabState });
    });
  }

  saveTabState(tabId, state, sendResponse) {
    chrome.storage.local.set({
      [`mockSync_${tabId}`]: state
    }, () => {
      sendResponse({ success: true });
    });
  }

  exportData(data, sendResponse) {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const filename = `mockSync-export-${Date.now()}.json`;
      
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, downloadId: downloadId });
        }
        
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async generateAIContent(params, sendResponse) {
    try {
      // Mock AI content generation - replace with actual AI service
      const content = await this.mockAIGeneration(params);
      sendResponse({ content: content });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async mockAIGeneration(params) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { contentType, toneStyle, language } = params;
    
    // Mock content based on parameters
    const mockContent = {
      headline: {
        professional: "Advanced Solutions for Modern Challenges",
        casual: "Awesome Stuff That Works",
        friendly: "We're Here to Help You Succeed",
        technical: "Optimized Implementation Framework",
        creative: "Unleash Your Creative Potential"
      },
      body: {
        professional: "Our comprehensive methodology ensures optimal outcomes through strategic planning and execution.",
        casual: "We keep things simple and effective. No complicated processes, just results.",
        friendly: "Let's work together to achieve your goals. We're excited to be part of your journey!",
        technical: "Leveraging advanced algorithms and scalable architecture for maximum efficiency.",
        creative: "Where innovation meets inspiration. Transform your ideas into reality."
      },
      cta: {
        professional: "Get Started Today",
        casual: "Let's Go!",
        friendly: "Join Us Now",
        technical: "Initialize System",
        creative: "Begin Your Journey"
      }
    };
    
    return mockContent[contentType]?.[toneStyle] || "Generated content placeholder";
  }

  logError(error, sender) {
    console.error('MockSync Error:', {
      error: error,
      url: sender.tab?.url,
      timestamp: new Date().toISOString()
    });
    
    // Store error for debugging
    chrome.storage.local.get(['mockSyncErrors'], (result) => {
      const errors = result.mockSyncErrors || [];
      errors.push({
        error: error,
        url: sender.tab?.url,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 errors
      if (errors.length > 100) {
        errors.splice(0, errors.length - 100);
      }
      
      chrome.storage.local.set({ mockSyncErrors: errors });
    });
  }

  migrateData(previousVersion) {
    // Handle data migration between versions
    const currentVersion = chrome.runtime.getManifest().version;
    
    if (this.compareVersions(previousVersion, '1.0.0') < 0) {
      // Migration logic for versions before 1.0.0
      console.log('Migrating data from version', previousVersion);
    }
  }

  compareVersions(a, b) {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart < bPart) return -1;
      if (aPart > bPart) return 1;
    }
    
    return 0;
  }
}

// Initialize background script
new MockSyncBackground();