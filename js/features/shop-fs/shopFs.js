/**
 * Auto FS - Feature: Shop Flash Sale
 */
window.AutoFS = window.AutoFS || {};

AutoFS.shopFs = {
  // State
  parsedProducts: [],

  // Elements
  elements: {},

  init() {
    this.cacheElements();
    this.bindEvents();
    this.loadSavedConfig();
    this.bindConfigPersistence();
    this.loadData();
  },

  cacheElements() {
    this.elements = {
      refreshBtn: document.getElementById('refreshAutoFsBtn'),
      downloadBtn: document.getElementById('downloadBtn'),
      downloadBatchBtn: document.getElementById('downloadBatchBtn'),
      statusEl: document.getElementById('status'),
      autoMinimumInventoryInput: document.getElementById('autoMinimumInventory'),
      priceAdjustmentInput: document.getElementById('priceAdjustment'),
      groups: [
        {
          from: document.getElementById('group1From'),
          to: document.getElementById('group1To'),
          count: document.getElementById('group1Count')
        },
        {
          from: document.getElementById('group2From'),
          to: document.getElementById('group2To'),
          count: document.getElementById('group2Count')
        },
        {
          from: document.getElementById('group3From'),
          to: document.getElementById('group3To'),
          count: document.getElementById('group3Count')
        }
      ]
    };
  },

  bindEvents() {
    if (this.elements.refreshBtn) {
      this.elements.refreshBtn.addEventListener('click', () => this.loadData());
    }
    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.addEventListener('click', () => this.downloadSingle());
    }
    if (this.elements.downloadBatchBtn) {
      this.elements.downloadBatchBtn.addEventListener('click', () => this.downloadBatch());
    }
  },

  setStatus(message, type = '') {
    const statusEl = this.elements.statusEl;
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = type ? `status ${type}` : 'status';
  },

  resetResult() {
    this.parsedProducts = [];
    if (this.elements.downloadBtn) this.elements.downloadBtn.disabled = true;
    if (this.elements.downloadBatchBtn) this.elements.downloadBatchBtn.disabled = true;
  },

  async loadData() {
    this.resetResult();

    try {
      this.setStatus('Đang lấy dữ liệu từ Google Sheet...', '');
      if (this.elements.refreshBtn) this.elements.refreshBtn.disabled = true;

      const rows = await AutoFS.googleSheet.loadRows({
        sheetId: AutoFS.CONFIG.SHOP_SHEET.SHEET_ID,
        gid: AutoFS.CONFIG.SHOP_SHEET.GID,
        sheetName: AutoFS.CONFIG.SHOP_SHEET.SHEET_NAME
      });
      this.parsedProducts = AutoFS.googleSheet.parsePivotRows(rows);

      if (this.elements.downloadBtn) this.elements.downloadBtn.disabled = false;
      if (this.elements.downloadBatchBtn) this.elements.downloadBatchBtn.disabled = false;

      this.setStatus('Đã lấy dữ liệu từ Google Sheet. Chọn kiểu tải file.', 'ok');
    } catch (error) {
      console.error(error);
      this.setStatus(`Lỗi: ${error.message}`, 'error');
    } finally {
      if (this.elements.refreshBtn) this.elements.refreshBtn.disabled = false;
    }
  },

  getEligibleProducts() {
    const minimumInventory = AutoFS.helpers.readNonNegativeInteger(
      this.elements.autoMinimumInventoryInput,
      'Tồn kho phân loại tối thiểu'
    );

    return this.parsedProducts
      .map(product => ({
        ...product,
        variants: product.variants.filter(variant =>
          variant.totalInventory >= minimumInventory
        )
      }))
      .filter(product => product.variants.length > 0);
  },

  readGroups() {
    const groups = this.elements.groups.map((group, index) => {
      const from = AutoFS.helpers.readPositiveInteger(group.from, `Đoạn ${index + 1}: Từ top`);
      const to = AutoFS.helpers.readOptionalPositiveInteger(group.to, `Đoạn ${index + 1}: Đến top`);
      const count = AutoFS.helpers.readNonNegativeInteger(group.count, `Đoạn ${index + 1}: Lấy`);

      if (from > to) {
        throw new Error(`Đoạn ${index + 1}: "Từ top" phải nhỏ hơn hoặc bằng "Đến top".`);
      }

      return {
        from,
        to,
        count,
        name: Number.isFinite(to) ? `Top ${from}-${to}` : `Top ${from} trở đi`
      };
    });

    this.validateNonOverlappingGroups(groups);
    return groups;
  },

  validateNonOverlappingGroups(groups) {
    for (let index = 1; index < groups.length; index += 1) {
      const previous = groups[index - 1];
      const current = groups[index];

      if (!Number.isFinite(previous.to)) {
        throw new Error(`Đoạn ${index} đang là "trở đi", nên không thể có đoạn ${index + 1} sau đó.`);
      }

      if (current.from <= previous.to) {
        throw new Error(`Đoạn ${index + 1} phải bắt đầu từ top ${previous.to + 1} trở đi để không bị gối đầu với đoạn ${index}.`);
      }
    }
  },

  buildOutputRows(products) {
    return products.flatMap(product =>
      product.variants.map(variant => ({
        'Mã sản phẩm': product.productId,
        'Mã phân loại hàng': variant.variantId,
        'Giá đã giảm': variant.price
      }))
    );
  },

  buildAdjustedExportRows(rows, priceAdjustment) {
    return rows.map(row => ({
      ...row,
      'Giá đã giảm': AutoFS.helpers.adjustPrice(row['Giá đã giảm'], priceAdjustment)
    }));
  },

  async downloadSingle() {
    if (!this.parsedProducts.length) return;

    const downloadBtn = this.elements.downloadBtn;
    const downloadBatchBtn = this.elements.downloadBatchBtn;
    const defaultButtonText = downloadBtn.textContent;

    if (downloadBatchBtn) downloadBatchBtn.disabled = true;
    this.setButtonLoading(downloadBtn, true, 'Đang tìm file phù hợp...', defaultButtonText);
    this.setStatus('Đang random file không trùng với 5 file tải gần nhất...', '');

    try {
      const groups = this.readGroups();
      const eligibleProducts = this.getEligibleProducts();
      const priceAdjustment = AutoFS.helpers.readPriceAdjustment(
        this.elements.priceAdjustmentInput,
        'Điều chỉnh giá'
      );

      if (!eligibleProducts.length) {
        throw new Error('Không có sản phẩm nào còn phân loại đạt ngưỡng tồn kho.');
      }

      const deadline = Date.now() + AutoFS.CONFIG.RANDOM_TIMEOUT_MS;
      const historyKey = AutoFS.CONFIG.STORAGE_KEYS.SHOP_DOWNLOAD_HISTORY;

      const selectedProducts = await AutoFS.sampler.generateBatchUniqueSelection(
        () => AutoFS.sampler.tryGenerateUniqueSelection(groups, eligibleProducts, [], true, historyKey, deadline),
        deadline,
        'Không tìm được file phù hợp trong 15 giây. Hãy thay đổi khoảng top rồi thử lại.'
      );

      const rows = this.buildOutputRows(selectedProducts);
      const exportRows = this.buildAdjustedExportRows(rows, priceAdjustment);

      if (!exportRows.length) {
        throw new Error('Không tìm thấy dòng phân loại có giá bán để xuất.');
      }

      const fileName = `Flash Sale ${AutoFS.helpers.getFileDateStamp()}.xlsx`;
      AutoFS.exporter.writeExcel(exportRows, fileName);
      AutoFS.storage.saveHistory(selectedProducts, historyKey);
      this.setStatus('Đã random và tải 1 file phù hợp.', 'ok');
    } catch (error) {
      console.error(error);
      this.setStatus(`Lỗi: ${error.message}`, 'error');
    } finally {
      this.setButtonLoading(downloadBtn, false, '', defaultButtonText);
      if (downloadBatchBtn) downloadBatchBtn.disabled = false;
    }
  },

  async downloadBatch() {
    if (!this.parsedProducts.length) return;

    const downloadBtn = this.elements.downloadBtn;
    const downloadBatchBtn = this.elements.downloadBatchBtn;
    const batchCount = AutoFS.CONFIG.BATCH_DOWNLOAD_COUNT;
    const defaultBatchButtonText = downloadBatchBtn.textContent;

    if (downloadBtn) downloadBtn.disabled = true;
    this.setButtonLoading(
      downloadBatchBtn,
      true,
      `Đang tạo ZIP ${batchCount} file...`,
      defaultBatchButtonText
    );
    this.setStatus(`Đang random và tạo ZIP ${batchCount} file...`, '');

    let groups;
    let priceAdjustment;
    let eligibleProducts;
    let selectedProductBatches;

    try {
      groups = this.readGroups();
      eligibleProducts = this.getEligibleProducts();

      if (!eligibleProducts.length) {
        throw new Error('Không có sản phẩm nào còn phân loại đạt ngưỡng tồn kho.');
      }

      selectedProductBatches = AutoFS.sampler.createNonOverlappingBatchSelections(
        groups,
        eligibleProducts,
        batchCount
      );
      priceAdjustment = AutoFS.helpers.readPriceAdjustment(
        this.elements.priceAdjustmentInput,
        'Điều chỉnh giá'
      );
    } catch (error) {
      console.error(error);
      this.setStatus(`Lỗi: ${error.message}`, 'error');
      if (downloadBtn) downloadBtn.disabled = false;
      this.setButtonLoading(downloadBatchBtn, false, '', defaultBatchButtonText);
      return;
    }

    let completedCount = 0;

    try {
      const zip = AutoFS.exporter.createZipArchive();
      const dateStamp = AutoFS.helpers.getFileDateStamp();

      for (let index = 1; index <= batchCount; index += 1) {
        const selectedProducts = selectedProductBatches[index - 1];
        const rows = this.buildOutputRows(selectedProducts);
        const exportRows = this.buildAdjustedExportRows(rows, priceAdjustment);

        if (!exportRows.length) {
          throw new Error('Không tìm thấy dòng phân loại có giá bán để xuất.');
        }

        const fileName = `Flash Sale ${dateStamp} ${AutoFS.helpers.formatBatchNumber(index)}.xlsx`;
        zip.file(fileName, AutoFS.exporter.buildWorkbookData(exportRows));
        completedCount = index;
      }

      await AutoFS.exporter.writeZipFile(zip, `Flash Sale ${dateStamp} ${batchCount} files.zip`);
      if (downloadBtn) downloadBtn.disabled = false;
      this.setButtonLoading(downloadBatchBtn, false, '', defaultBatchButtonText);
      this.setStatus(`Đã tải ZIP gồm ${batchCount} file. Lần tải này không được lưu vào lịch sử.`, 'ok');
    } catch (error) {
      console.error(error);
      if (downloadBtn) downloadBtn.disabled = false;
      this.setButtonLoading(downloadBatchBtn, false, '', defaultBatchButtonText);
      this.setStatus(`Lỗi khi tạo file thứ ${completedCount + 1}: ${error.message}`, 'error');
    }
  },

  setButtonLoading(button, isLoading, loadingText, defaultText) {
    if (!button) return;
    if (!button.dataset.defaultHtml) {
      button.dataset.defaultHtml = button.innerHTML;
    }

    button.innerHTML = isLoading
      ? `
        <span class="button-spinner" aria-hidden="true"></span>
        <span><strong>${AutoFS.helpers.escapeHtml(loadingText)}</strong><small>Vui lòng chờ trong giây lát</small></span>
      `
      : button.dataset.defaultHtml;
    button.disabled = isLoading;
    button.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  },

  loadSavedConfig() {
    const config = AutoFS.storage.loadConfig(AutoFS.CONFIG.STORAGE_KEYS.SHOP_CONFIG);
    if (!config || typeof config !== 'object') return;

    if (Array.isArray(config.groups)) {
      config.groups.forEach((groupConfig, index) => {
        const group = this.elements.groups[index];
        if (!group || !groupConfig || typeof groupConfig !== 'object') return;

        this.setInputValue(group.from, groupConfig.from);
        this.setInputValue(group.to, groupConfig.to);
        this.setInputValue(group.count, groupConfig.count);
      });
    }

    this.setInputValue(this.elements.priceAdjustmentInput, config.priceAdjustment);
    this.setInputValue(this.elements.autoMinimumInventoryInput, config.autoMinimumInventory);
  },

  saveCurrentConfig() {
    const config = {
      groups: this.elements.groups.map(group => ({
        from: group.from ? group.from.value : '',
        to: group.to ? group.to.value : '',
        count: group.count ? group.count.value : ''
      })),
      autoMinimumInventory: this.elements.autoMinimumInventoryInput ? this.elements.autoMinimumInventoryInput.value : '',
      priceAdjustment: this.elements.priceAdjustmentInput ? this.elements.priceAdjustmentInput.value : ''
    };

    AutoFS.storage.saveConfig(AutoFS.CONFIG.STORAGE_KEYS.SHOP_CONFIG, config);
  },

  bindConfigPersistence() {
    this.getConfigInputs().forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => this.saveCurrentConfig());
      input.addEventListener('change', () => this.saveCurrentConfig());
    });
  },

  getConfigInputs() {
    return this.elements.groups.flatMap(group => [group.from, group.to, group.count])
      .concat([
        this.elements.priceAdjustmentInput,
        this.elements.autoMinimumInventoryInput
      ]);
  },

  setInputValue(input, value) {
    if (input && typeof value === 'string') {
      input.value = value;
    }
  }
};
