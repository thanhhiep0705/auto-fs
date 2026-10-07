/**
 * Auto FS - Local Storage & Configuration Persistence
 */
window.AutoFS = window.AutoFS || {};

AutoFS.storage = {
  /**
   * Read download history from localStorage
   */
  readHistory(historyKey = AutoFS.CONFIG.STORAGE_KEYS.SHOP_DOWNLOAD_HISTORY) {
    try {
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      if (!Array.isArray(history)) return [];

      return history
        .filter(entry => entry && Array.isArray(entry.productIds))
        .map(entry => ({
          downloadedAt: entry.downloadedAt || '',
          productIds: entry.productIds.map(AutoFS.helpers.cleanCell).filter(Boolean),
          products: Array.isArray(entry.products)
            ? entry.products.map(product => ({
              productId: AutoFS.helpers.cleanCell(product.productId),
              rank: Number(product.rank) || ''
            })).filter(product => product.productId)
            : entry.productIds.map(productId => ({
              productId: AutoFS.helpers.cleanCell(productId),
              rank: ''
            })).filter(product => product.productId)
        }))
        .slice(0, AutoFS.CONFIG.MAX_DOWNLOAD_HISTORY);
    } catch (error) {
      console.warn('Không đọc được lịch sử tải:', error);
      return [];
    }
  },

  /**
   * Save download history to localStorage
   */
  saveHistory(products, historyKey = AutoFS.CONFIG.STORAGE_KEYS.SHOP_DOWNLOAD_HISTORY) {
    const uniqueProducts = [];
    const seenProductIds = new Set();

    for (const product of products) {
      const productId = AutoFS.helpers.cleanCell(product.productId);
      if (!productId || seenProductIds.has(productId)) continue;

      seenProductIds.add(productId);
      uniqueProducts.push({
        productId,
        rank: product.rank
      });
    }

    if (!uniqueProducts.length) return;

    const history = this.readHistory(historyKey);
    history.unshift({
      downloadedAt: new Date().toISOString(),
      productIds: uniqueProducts.map(product => product.productId),
      products: uniqueProducts
    });

    localStorage.setItem(
      historyKey,
      JSON.stringify(history.slice(0, AutoFS.CONFIG.MAX_DOWNLOAD_HISTORY))
    );
  },

  /**
   * Load arbitrary JSON config object
   */
  loadConfig(key) {
    try {
      const config = JSON.parse(localStorage.getItem(key) || '{}');
      return (config && typeof config === 'object') ? config : {};
    } catch (error) {
      console.warn(`Không đọc được cấu hình từ khóa ${key}:`, error);
      return {};
    }
  },

  /**
   * Save arbitrary JSON config object
   */
  saveConfig(key, config) {
    try {
      localStorage.setItem(key, JSON.stringify(config));
    } catch (error) {
      console.warn(`Không lưu được cấu hình cho khóa ${key}:`, error);
    }
  }
};
