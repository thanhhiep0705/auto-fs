/**
 * Auto FS - Tab Manager
 */
window.AutoFS = window.AutoFS || {};

AutoFS.tabs = {
  tabButtons: [],
  tabPanels: [],

  init() {
    this.tabButtons = Array.from(document.querySelectorAll('.tab-button[data-tab]'));
    this.tabPanels = Array.from(document.querySelectorAll('.tab-panel'));

    if (!this.tabButtons.length) return;

    this.bindEvents();
    this.restoreActiveTab();
  },

  bindEvents() {
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.dataset.tab;
        this.switchTab(targetTabId);
      });
    });
  },

  switchTab(tabId) {
    // Update buttons
    this.tabButtons.forEach(btn => {
      const isSelected = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    // Update panels
    this.tabPanels.forEach(panel => {
      const isActive = panel.id === tabId;
      panel.classList.toggle('active', isActive);
    });

    // Save preference
    try {
      localStorage.setItem(AutoFS.CONFIG.STORAGE_KEYS.ACTIVE_TAB, tabId);
    } catch (e) {
      // Ignore
    }

    // Trigger feature init if needed
    if (tabId === 'portalFsPanel' && AutoFS.portalFs) {
      AutoFS.portalFs.init();
    }
  },

  restoreActiveTab() {
    let activeTabId = 'shopFsPanel';

    try {
      const savedTab = localStorage.getItem(AutoFS.CONFIG.STORAGE_KEYS.ACTIVE_TAB);
      if (savedTab && document.getElementById(savedTab)) {
        activeTabId = savedTab;
      }
    } catch (e) {
      // Ignore
    }

    this.switchTab(activeTabId);
  }
};
