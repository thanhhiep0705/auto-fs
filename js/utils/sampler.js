/**
 * Auto FS - Sampler & Randomizer Engine
 */
window.AutoFS = window.AutoFS || {};

AutoFS.sampler = {
  /**
   * Fisher-Yates shuffle algorithm
   */
  shuffle(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  },

  /**
   * Sample N items from an array with optional group labeling
   */
  sample(products, count, groupName) {
    const shuffled = this.shuffle(products);
    return shuffled.slice(0, Math.min(count, shuffled.length)).map(product => ({
      ...product,
      groupName
    }));
  },

  hasDuplicates(values) {
    return new Set(values).size !== values.length;
  },

  /**
   * Select products across defined rank groups
   */
  selectProductsForGroups(groups, products) {
    return groups.flatMap(group => {
      const productsInRange = products.filter(product =>
        product.rank >= group.from && product.rank <= group.to
      );
      return this.sample(productsInRange, group.count, group.name);
    });
  },

  /**
   * Check max duplicates against history lists
   */
  getMaxHistoryDuplicateCount(
    productIds,
    historyKey = AutoFS.CONFIG.STORAGE_KEYS.SHOP_DOWNLOAD_HISTORY,
    pendingProductIdLists = [],
    includeDownloadHistory = true
  ) {
    const historyProductIdLists = (
      includeDownloadHistory
        ? AutoFS.storage.readHistory(historyKey).map(entry => entry.productIds)
        : []
    ).concat(pendingProductIdLists);

    if (!historyProductIdLists.length) return 0;

    const currentIds = new Set(productIds);
    return Math.max(...historyProductIdLists.map(historyProductIds =>
      historyProductIds.filter(productId => currentIds.has(productId)).length
    ));
  },

  /**
   * Try to generate a single random selection matching criteria and history
   */
  tryGenerateUniqueSelection(
    groups,
    products,
    pendingProductIdLists = [],
    includeDownloadHistory = true,
    historyKey = AutoFS.CONFIG.STORAGE_KEYS.SHOP_DOWNLOAD_HISTORY,
    deadline = Infinity
  ) {
    const expectedProductCount = groups.reduce((total, group) => total + group.count, 0);
    const maxAttempts = AutoFS.CONFIG.MAX_RANDOM_ATTEMPTS;
    const maxDuplicates = AutoFS.CONFIG.MAX_ALLOWED_DUPLICATES;

    for (
      let attempt = 0;
      attempt < maxAttempts && Date.now() < deadline;
      attempt += 1
    ) {
      const selectedProducts = this.selectProductsForGroups(groups, products);
      const selectedProductIds = selectedProducts.map(product => product.productId);

      if (
        selectedProducts.length !== expectedProductCount ||
        this.hasDuplicates(selectedProductIds)
      ) {
        continue;
      }

      const duplicateCount = this.getMaxHistoryDuplicateCount(
        selectedProductIds,
        historyKey,
        pendingProductIdLists,
        includeDownloadHistory
      );

      if (duplicateCount <= maxDuplicates) {
        return selectedProducts;
      }
    }

    return null;
  },

  /**
   * Validate that we have enough unique products for non-overlapping batches
   */
  validateBatchProductCapacity(groups, products, batchCount) {
    const insufficientGroups = groups.flatMap((group, index) => {
      const availableCount = products.filter(product =>
        product.rank >= group.from && product.rank <= group.to
      ).length;
      const requiredCount = group.count * batchCount;

      if (availableCount >= requiredCount) {
        return [];
      }

      return [{
        index: index + 1,
        name: group.name,
        availableCount,
        requiredCount,
        missingCount: requiredCount - availableCount
      }];
    });

    if (!insufficientGroups.length) {
      return;
    }

    const details = insufficientGroups.map(group =>
      `Đoạn ${group.index} (${group.name}) cần ${group.requiredCount} sản phẩm, hiện có ${group.availableCount}, thiếu ${group.missingCount}`
    ).join('; ');

    throw new Error(
      `Không đủ sản phẩm hợp lệ để tạo ${batchCount} file không trùng nhau. ${details}. ` +
      'Hãy giảm số lượng lấy, mở rộng khoảng top hoặc giảm ngưỡng tồn kho.'
    );
  },

  /**
   * Split products into non-overlapping batch selections
   */
  createNonOverlappingBatchSelections(groups, products, batchCount) {
    this.validateBatchProductCapacity(groups, products, batchCount);

    const productPools = groups.map(group => ({
      group,
      products: this.shuffle(products.filter(product =>
        product.rank >= group.from && product.rank <= group.to
      ))
    }));

    return Array.from({ length: batchCount }, (_, batchIndex) =>
      productPools.flatMap(({ group, products: pool }) => {
        const startIndex = batchIndex * group.count;
        return pool.slice(startIndex, startIndex + group.count).map(product => ({
          ...product,
          groupName: group.name
        }));
      })
    );
  },

  /**
   * Async polling generator with deadline
   */
  async generateBatchUniqueSelection(generateSelection, deadline, timeoutMessage) {
    let attempt = 0;

    while (Date.now() < deadline) {
      const selectedProducts = generateSelection();

      if (selectedProducts) {
        return selectedProducts;
      }

      attempt += 1;
      if (attempt % 10 === 0) {
        await AutoFS.helpers.waitForNextFrame();
      }
    }

    throw new Error(timeoutMessage);
  }
};
