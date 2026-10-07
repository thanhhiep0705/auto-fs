/**
 * Auto FS - Main Application Entry
 */
window.AutoFS = window.AutoFS || {};

AutoFS.init = function() {
  // Initialize tab navigation
  if (AutoFS.tabs) {
    AutoFS.tabs.init();
  }

  // Initialize Shop Flash Sale feature
  if (AutoFS.shopFs) {
    AutoFS.shopFs.init();
  }

  // Initialize Shopee Portal Flash Sale feature
  if (AutoFS.portalFs) {
    AutoFS.portalFs.init();
  }
};

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AutoFS.init);
} else {
  AutoFS.init();
}
