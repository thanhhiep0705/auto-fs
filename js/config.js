/**
 * Auto FS - Global Configuration
 */
window.AutoFS = window.AutoFS || {};

AutoFS.CONFIG = {
  // Google Sheet Configuration for Shop Flash Sale (Tab 1)
  SHOP_SHEET: {
    SHEET_ID: '1Pi__I2Uwd3OTGp7ff8Ju6qC0oQHidTZMu11ljZbNPM4',
    GID: '1099495700',
    SHEET_NAME: ''
  },

  // Google Sheet Configuration for Shopee Portal Flash Sale (Tab 2)
  // Lấy dữ liệu từ tab sheet 'This Month'
  PORTAL_SHEET: {
    SHEET_ID: '1Pi__I2Uwd3OTGp7ff8Ju6qC0oQHidTZMu11ljZbNPM4',
    GID: '',
    SHEET_NAME: 'This Month'
  },

  // LocalStorage Keys
  STORAGE_KEYS: {
    SHOP_CONFIG: 'flashSaleToolConfig',
    PORTAL_CONFIG: 'portalFlashSaleToolConfig',
    SHOP_DOWNLOAD_HISTORY: 'flashSaleRecentDownloadedProductIds',
    PORTAL_DOWNLOAD_HISTORY: 'portalFlashSaleRecentDownloadedProductIds',
    ACTIVE_TAB: 'flashSaleActiveTab'
  },

  // Algorithm & Limits
  MAX_DOWNLOAD_HISTORY: 5,
  MAX_ALLOWED_DUPLICATES: 0,
  MAX_RANDOM_ATTEMPTS: 500,
  BATCH_DOWNLOAD_COUNT: 8,
  RANDOM_TIMEOUT_MS: 15000,
  SHEET_REQUEST_TIMEOUT_MS: 20000
};
