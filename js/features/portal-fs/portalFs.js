/**
 * Auto FS - Feature: Shopee Portal Flash Sale
 */
window.AutoFS = window.AutoFS || {};

AutoFS.portalFs = {
  // State
  isInitialized: false,
  hasLoadedData: false,
  parsedProducts: [],
  selectedProducts: [],
  deletedVariantIds: new Set(),
  filteredRows: [],
  lastFilterSignature: '',

  // Elements
  elements: {},

  // Template Columns matching 'Template FS Shopee'
  TEMPLATE_COLUMNS: [
    'Tên sản phẩm',
    'Mã sản phẩm',
    'Tên hiển thị sản phẩm',
    'Tên phân loại hàng',
    'Mã phân loại hàng',
    'Ngành hàng',
    'Ngành hàng con',
    'Ngành hàng cấp 3',
    'Doanh số',
    'Giá Gốc',
    'Giá đang hiển thị',
    'Giá khuyến mãi',
    'Giá khuyến mãi được đề xuất',
    'Kho hàng',
    'Kho hàng dự trữ cho khuyến mãi',
    'Giới hạn mua hàng'
  ],

  // Exact 3 Header Rows matching tab 'Template FS Shopee'
  TEMPLATE_HEADER_ROWS: [
    // Dòng 1: Tên các cột
    [
      'Tên sản phẩm',
      'Mã sản phẩm',
      'Tên hiển thị sản phẩm',
      'Tên phân loại hàng',
      'Mã phân loại hàng',
      'Ngành hàng',
      'Ngành hàng con',
      'Ngành hàng cấp 3',
      'Doanh số',
      'Giá Gốc',
      'Giá đang hiển thị',
      'Giá khuyến mãi',
      'Giá khuyến mãi được đề xuất',
      'Kho hàng',
      'Kho hàng dự trữ cho khuyến mãi',
      'Giới hạn mua hàng'
    ],
    // Dòng 2: Phân loại bắt buộc / không bắt buộc
    [
      'Không bắt buộc',
      'Bắt buộc',
      'Bắt buộc',
      'Không bắt buộc',
      'Bắt buộc',
      'Không bắt buộc',
      'Không bắt buộc',
      'Không bắt buộc',
      'Không bắt buộc',
      'Không bắt buộc',
      'Để trưng bày',
      'Bắt buộc (Discount 3%)',
      'Không bắt buộc',
      'Không bắt buộc',
      'Bắt buộc',
      'Bắt buộc'
    ],
    // Dòng 3: Mô tả chi tiết cho từng cột
    [
      'Tên các sản phẩm khả dụng tham gia Khung giờ của chương trình',
      'Điền chính xác mã sản phẩm tham gia Khung giờ của chương trình',
      'Tên hiển thị sản phẩm sẽ được hiển thị trên Flash Sale sau khi sản phẩm được xét duyệt thành công',
      'Tên các phân loại hàng khả dụng tham gia Khung giờ của chương trình',
      'Điền chính xác mã phân loại hàng tham gia Khung giờ của chương trình',
      'Tên ngành hàng trong Hướng dẫn về ngành hàng Shopee',
      'Tên ngành hàng con trong Hướng dẫn về ngành hàng Shopee',
      'Tên ngành hàng cấp 3 trong Hướng dẫn về ngành hàng Shopee',
      'Doanh số tương ứng với phân loại hàng của sản phẩm',
      'Giá cuối cùng sau Thuế hiển thị với Người mua',
      'Giá đang hiển thị tới người mua',
      'Hãy điền giá khuyến mãi mong muốn chạy chương trình. Ưu đãi càng cao, khả năng được phê duyệt tham gia chương trình và tăng doanh số càng lớn',
      'Giá khuyến mãi của phân loại hàng được đề xuất bởi hệ thống',
      'Kho hàng được điền ở đây là số lượng hàng hóa trong kho sẽ hiển thị cho Người mua thấy',
      'Điền số lượng hàng hóa khuyến mãi mà bạn muốn dự trữ để tham gia Khung giờ của chương trình này. Hãy luôn đảm bảo kho đủ hàng cho chương trình khuyến mãi, số lượng hàng khuyến mãi bán ra sẽ trừ dần vào tổng kho hàng của sản phẩm cho đến khi Khung giờ của chương trình kết thúc',
      'Số lượng sản phẩm tối đa Người mua có thể mua trong Chương trình giảm giá. \n Lưu ý: Nếu giới hạn mua bằng 0 hoặc để trống, hệ thống sẽ xác nhận giới hạn mua là "Không giới hạn"'
    ]
  ],

  init() {
    this.cacheElements();
    this.bindEvents();
    this.loadSavedConfig();
    this.bindConfigPersistence();
    this.loadData();
    this.isInitialized = true;
  },

  cacheElements() {
    this.elements = {
      refreshBtn: document.getElementById('refreshPortalFsBtn'),
      downloadBtn: document.getElementById('downloadPortalFsBtn'),
      randomQuickBtn: document.getElementById('randomPortalFsQuickBtn'),
      statusEl: document.getElementById('portalStatus'),
      previewCountEl: document.getElementById('portalPreviewCount'),
      previewTableBody: document.getElementById('portalPreviewBody'),
      previewContainer: document.getElementById('portalPreviewContainer'),
      
      // Filter Inputs
      topFromInput: document.getElementById('portalTopFrom'),
      topToInput: document.getElementById('portalTopTo'),
      skuCountInput: document.getElementById('portalSkuCount'),
      minLmPercentInput: document.getElementById('portalMinLmPercent'),
      minStockInput: document.getElementById('portalMinStock'),
      
      // Price & Campaign Inputs
      priceTypeSelect: document.getElementById('portalPriceType'),
      priceValueInput: document.getElementById('portalPriceValue'),
      priceValueSuffix: document.getElementById('portalPriceSuffix'),
      campaignStockInput: document.getElementById('portalCampaignStock'),
      purchaseLimitInput: document.getElementById('portalPurchaseLimit')
    };
  },

  bindEvents() {
    if (this.elements.refreshBtn) {
      this.elements.refreshBtn.addEventListener('click', () => this.loadData());
    }
    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.addEventListener('click', () => this.downloadFile());
    }
    if (this.elements.randomQuickBtn) {
      this.elements.randomQuickBtn.addEventListener('click', () => this.randomizeSelection());
    }
    if (this.elements.priceTypeSelect) {
      this.elements.priceTypeSelect.addEventListener('change', () => {
        if (this.elements.priceValueInput) {
          this.elements.priceValueInput.value = '0';
        }
        this.updatePriceSuffix();
        this.saveCurrentConfig();
        this.updatePreview();
      });
    }

    // Event delegation for row deletion in preview table
    if (this.elements.previewTableBody) {
      this.elements.previewTableBody.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-row-btn');
        if (!deleteBtn) return;
        const variantId = deleteBtn.dataset.variantId;
        if (variantId) {
          this.deleteVariantRow(variantId);
        }
      });
    }

    // Filter criteria changes -> re-evaluate eligible products & randomize if needed
    const filterInputs = [
      this.elements.topFromInput,
      this.elements.topToInput,
      this.elements.skuCountInput,
      this.elements.minLmPercentInput,
      this.elements.minStockInput
    ];

    filterInputs.forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => this.handleFilterChange());
      input.addEventListener('change', () => this.handleFilterChange());
    });

    // Price & limit inputs -> update prices without resetting selected SKU set
    const priceInputs = [
      this.elements.priceValueInput,
      this.elements.campaignStockInput,
      this.elements.purchaseLimitInput
    ];

    priceInputs.forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => this.updatePreview());
      input.addEventListener('change', () => this.updatePreview());
    });
  },

  deleteVariantRow(variantId) {
    this.deletedVariantIds.add(variantId);
    this.updatePreview();
  },

  updatePriceSuffix() {
    if (!this.elements.priceTypeSelect || !this.elements.priceValueSuffix) return;
    const type = this.elements.priceTypeSelect.value;
    if (type === 'percent') {
      this.elements.priceValueSuffix.textContent = '%';
      if (this.elements.priceValueInput) {
        this.elements.priceValueInput.step = '1';
        this.elements.priceValueInput.placeholder = '0';
      }
    } else {
      this.elements.priceValueSuffix.textContent = '₫';
      if (this.elements.priceValueInput) {
        this.elements.priceValueInput.step = '1000';
        this.elements.priceValueInput.placeholder = '0';
      }
    }
  },

  setStatus(message, type = '') {
    const statusEl = this.elements.statusEl;
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = type ? `status ${type}` : 'status';
  },

  async loadData() {
    try {
      this.setStatus('Đang lấy dữ liệu Flash Sale Cổng Shopee...', '');
      if (this.elements.refreshBtn) this.elements.refreshBtn.disabled = true;

      const rows = await AutoFS.googleSheet.loadRows({
        sheetId: AutoFS.CONFIG.PORTAL_SHEET.SHEET_ID,
        gid: AutoFS.CONFIG.PORTAL_SHEET.GID,
        sheetName: AutoFS.CONFIG.PORTAL_SHEET.SHEET_NAME
      });
      this.parsedProducts = AutoFS.googleSheet.parseThisMonthRows(rows);
      this.hasLoadedData = true;

      this.setStatus('Đã lấy dữ liệu thành công.', 'ok');
      this.deletedVariantIds.clear();
      this.randomizeSelection();
    } catch (error) {
      console.error(error);
      this.setStatus(`Lỗi: ${error.message}`, 'error');
    } finally {
      if (this.elements.refreshBtn) this.elements.refreshBtn.disabled = false;
    }
  },

  readFilterConfig() {
    const topFrom = this.elements.topFromInput ? Number(this.elements.topFromInput.value) || 1 : 1;
    const rawTopTo = this.elements.topToInput ? this.elements.topToInput.value.trim() : '';
    const topTo = rawTopTo === '' ? Infinity : Number(rawTopTo) || Infinity;

    const rawSkuCount = this.elements.skuCountInput ? this.elements.skuCountInput.value.trim() : '';
    const skuCount = rawSkuCount === '' ? null : Math.max(1, Number(rawSkuCount) || 1);

    const rawLm = this.elements.minLmPercentInput ? this.elements.minLmPercentInput.value.trim() : '';
    const minLmPercent = rawLm === '' ? null : Number(rawLm);

    const minStock = this.elements.minStockInput ? Number(this.elements.minStockInput.value) || 0 : 0;
    
    const priceType = this.elements.priceTypeSelect ? this.elements.priceTypeSelect.value : 'percent';
    const priceValue = this.elements.priceValueInput ? Number(this.elements.priceValueInput.value) || 0 : 0;

    const campaignStock = this.elements.campaignStockInput ? Math.max(0, Number(this.elements.campaignStockInput.value) || 10) : 10;
    const purchaseLimit = this.elements.purchaseLimitInput ? Math.max(0, Number(this.elements.purchaseLimitInput.value) || 0) : 0;

    return {
      topFrom,
      topTo,
      skuCount,
      minLmPercent,
      minStock,
      priceType,
      priceValue,
      campaignStock,
      purchaseLimit
    };
  },

  getEligibleProducts(config) {
    if (!this.parsedProducts.length) return [];

    return this.parsedProducts
      .filter(product => product.rank >= config.topFrom && product.rank <= config.topTo)
      .map(product => {
        const validVariants = product.variants
          .filter(variant => {
            // Exclude manually deleted variants
            if (this.deletedVariantIds.has(variant.variantId)) return false;
            // Stock check
            if (variant.totalInventory < config.minStock) return false;
            // % LM growth check (Lấy model có % tăng trưởng LM <= mức người dùng nhập)
            if (config.minLmPercent !== null && variant.lmGrowth !== null && variant.lmGrowth !== undefined) {
              if (variant.lmGrowth > config.minLmPercent) return false;
            }
            return true;
          })
          .sort((a, b) => (Number(b.revenue) || 0) - (Number(a.revenue) || 0));

        const totalRevenue = validVariants.reduce((sum, v) => sum + (Number(v.revenue) || 0), 0);

        return {
          ...product,
          totalRevenue,
          variants: validVariants
        };
      })
      .filter(product => product.variants.length > 0)
      .sort((a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0));
  },

  handleFilterChange() {
    const config = this.readFilterConfig();
    const signature = `${config.topFrom}-${config.topTo}-${config.skuCount}-${config.minLmPercent}-${config.minStock}`;

    if (signature !== this.lastFilterSignature) {
      this.lastFilterSignature = signature;
      this.deletedVariantIds.clear();
      this.randomizeSelection();
    }
  },

  randomizeSelection() {
    if (!this.parsedProducts.length) return;

    this.deletedVariantIds.clear();
    const config = this.readFilterConfig();
    const eligibleProducts = this.getEligibleProducts(config);

    if (!eligibleProducts.length) {
      this.selectedProducts = [];
      this.updatePreview();
      return;
    }

    if (config.skuCount && config.skuCount > 0) {
      // Shuffle & pick N products
      const shuffled = AutoFS.sampler.shuffle(eligibleProducts);
      const picked = shuffled.slice(0, Math.min(config.skuCount, shuffled.length));
      // Sắp xếp các sản phẩm được chọn theo doanh thu giảm dần
      picked.sort((a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0));
      this.selectedProducts = picked;
    } else {
      // Take all eligible products sorted by revenue descending
      this.selectedProducts = [...eligibleProducts].sort((a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0));
    }

    this.updatePreview();
  },

  calculatePromoPrice(originalPrice, priceType, priceValue) {
    const numericPrice = AutoFS.helpers.parsePrice(originalPrice);
    let promoPrice = numericPrice;

    if (priceType === 'percent') {
      // priceValue is % discount (e.g. 5% means price * 0.95)
      promoPrice = Math.round(numericPrice * (1 - priceValue / 100));
    } else {
      // priceValue is fixed discount/offset (e.g. -10000)
      promoPrice = numericPrice + priceValue;
    }

    if (promoPrice < 0) promoPrice = 0;
    return promoPrice;
  },

  buildExportRows() {
    if (!this.selectedProducts.length) return [];

    const config = this.readFilterConfig();
    const resultRows = [];

    // Sắp xếp sản phẩm theo doanh thu giảm dần
    const sortedProducts = [...this.selectedProducts].sort((a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0));

    for (const product of sortedProducts) {
      // Sắp xếp phân loại trong sản phẩm theo doanh thu giảm dần
      const sortedVariants = [...product.variants].sort((a, b) => (Number(b.revenue) || 0) - (Number(a.revenue) || 0));

      for (const variant of sortedVariants) {
        // Skip manually deleted variants
        if (this.deletedVariantIds.has(variant.variantId)) {
          continue;
        }

        const promoPrice = this.calculatePromoPrice(variant.price, config.priceType, config.priceValue);

        resultRows.push({
          'Tên sản phẩm': product.productName,
          'Mã sản phẩm': product.productId,
          'Tên hiển thị sản phẩm': product.productName,
          'Tên phân loại hàng': variant.variantName,
          'Mã phân loại hàng': variant.variantId,
          'Ngành hàng': '',
          'Ngành hàng con': '',
          'Ngành hàng cấp 3': '',
          'Doanh số': variant.revenue ? String(variant.revenue) : '',
          'Giá Gốc': '',
          'Giá đang hiển thị': String(variant.price),
          'Giá khuyến mãi': String(promoPrice),
          'Giá khuyến mãi được đề xuất': '',
          'Kho hàng': String(variant.totalInventory),
          'Kho hàng dự trữ cho khuyến mãi': String(config.campaignStock),
          'Giới hạn mua hàng': String(config.purchaseLimit),
          // Meta fields for UI rendering
          _rank: product.rank,
          _rawPromoPrice: promoPrice,
          _rawPrice: variant.price
        });
      }
    }

    return resultRows;
  },

  updatePreview() {
    const rows = this.buildExportRows();
    this.filteredRows = rows;

    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.disabled = rows.length === 0;
    }

    // Update count summary
    if (this.elements.previewCountEl) {
      const uniqueSkus = new Set(rows.map(r => r['Mã sản phẩm'])).size;
      const config = this.readFilterConfig();
      const eligibleTotal = this.getEligibleProducts(config).length;
      
      if (config.skuCount && config.skuCount > 0) {
        this.elements.previewCountEl.innerHTML = `Đã chọn <strong>${uniqueSkus}</strong> SKU (${rows.length} phân loại).`;
      } else {
        this.elements.previewCountEl.innerHTML = `Đang chọn <strong>${uniqueSkus}</strong> SKU (${rows.length} phân loại) đủ điều kiện.`;
      }
    }

    // Render Preview Table Rows
    const tbody = this.elements.previewTableBody;
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" class="empty-cell">Không có sản phẩm nào phù hợp với bộ lọc hiện tại.</td>
        </tr>
      `;
      return;
    }

    // Render rows
    tbody.innerHTML = rows.map((row, index) => `
      <tr>
        <td class="numeric-cell">${index + 1}</td>
        <td><code>${AutoFS.helpers.escapeHtml(row['Mã sản phẩm'])}</code></td>
        <td class="name-cell" title="${AutoFS.helpers.escapeHtml(row['Tên hiển thị sản phẩm'])}">
          <span class="name-ellipsis">${AutoFS.helpers.escapeHtml(row['Tên hiển thị sản phẩm'])}</span>
        </td>
        <td><code>${AutoFS.helpers.escapeHtml(row['Mã phân loại hàng'])}</code></td>
        <td>${AutoFS.helpers.escapeHtml(row['Tên phân loại hàng'])}</td>
        <td class="numeric-cell">${Number(row['Giá đang hiển thị']).toLocaleString('vi-VN')} ₫</td>
        <td class="numeric-cell highlight-promo">${Number(row['Giá khuyến mãi']).toLocaleString('vi-VN')} ₫</td>
        <td class="numeric-cell">${Number(row['Kho hàng']).toLocaleString('vi-VN')}</td>
        <td class="numeric-cell">${row['Kho hàng dự trữ cho khuyến mãi']}</td>
        <td class="numeric-cell">${row['Giới hạn mua hàng'] === '0' ? 'Không giới hạn' : row['Giới hạn mua hàng']}</td>
        <td style="text-align: center;">
          <button type="button" class="delete-row-btn" data-variant-id="${AutoFS.helpers.escapeHtml(row['Mã phân loại hàng'])}" title="Xóa dòng này khỏi danh sách xuất">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
  },

  downloadFile() {
    const rows = this.buildExportRows();
    if (!rows.length) {
      alert('Không có sản phẩm nào để xuất file. Vui lòng kiểm tra lại điều kiện lọc.');
      return;
    }

    try {
      this.setStatus('Đang tạo file Excel...', '');
      
      // Tạo dữ liệu dạng ma trận hàng (AOA): 3 dòng đầu giữ nguyên từ Template, các dòng tiếp theo là sản phẩm phù hợp
      const aoaData = [
        ...this.TEMPLATE_HEADER_ROWS,
        ...rows.map(row => [
          row['Tên sản phẩm'] || '',
          String(row['Mã sản phẩm'] || ''),
          row['Tên hiển thị sản phẩm'] || '',
          row['Tên phân loại hàng'] || '',
          String(row['Mã phân loại hàng'] || ''),
          row['Ngành hàng'] || '',
          row['Ngành hàng con'] || '',
          row['Ngành hàng cấp 3'] || '',
          row['Doanh số'] !== '' && row['Doanh số'] !== undefined ? (Number(row['Doanh số']) || '') : '',
          row['Giá Gốc'] || '',
          Number(row['Giá đang hiển thị']) || 0,
          Number(row['Giá khuyến mãi']) || 0,
          row['Giá khuyến mãi được đề xuất'] || '',
          row['Kho hàng'] !== '' && row['Kho hàng'] !== undefined ? (Number(row['Kho hàng']) || '') : '',
          Number(row['Kho hàng dự trữ cho khuyến mãi']) || 0,
          Number(row['Giới hạn mua hàng']) || 0
        ])
      ];

      const timeStamp = AutoFS.helpers.getFileTimeStamp();
      const fileName = `Template FS Shopee ${timeStamp}.xlsx`;

      AutoFS.exporter.writeExcelAOA(
        aoaData,
        fileName,
        'Template FS Shopee'
      );

      this.setStatus(`Đã tải file thành công: ${fileName}`, 'ok');
    } catch (error) {
      console.error(error);
      this.setStatus(`Lỗi khi tạo file: ${error.message}`, 'error');
    }
  },

  loadSavedConfig() {
    const config = AutoFS.storage.loadConfig(AutoFS.CONFIG.STORAGE_KEYS.PORTAL_CONFIG);
    if (!config || typeof config !== 'object') return;

    if (this.elements.topFromInput && config.topFrom) this.elements.topFromInput.value = config.topFrom;
    if (this.elements.topToInput && config.topTo) this.elements.topToInput.value = config.topTo;
    if (this.elements.skuCountInput && config.skuCount) this.elements.skuCountInput.value = config.skuCount;
    if (this.elements.minLmPercentInput && config.minLmPercent !== undefined) this.elements.minLmPercentInput.value = config.minLmPercent;
    if (this.elements.minStockInput && config.minStock) this.elements.minStockInput.value = config.minStock;
    if (this.elements.priceTypeSelect && config.priceType) this.elements.priceTypeSelect.value = config.priceType;
    if (this.elements.priceValueInput && config.priceValue !== undefined) this.elements.priceValueInput.value = config.priceValue;
    if (this.elements.campaignStockInput && config.campaignStock) this.elements.campaignStockInput.value = config.campaignStock;
    if (this.elements.purchaseLimitInput && config.purchaseLimit !== undefined) this.elements.purchaseLimitInput.value = config.purchaseLimit;

    this.updatePriceSuffix();
  },

  saveCurrentConfig() {
    const config = {
      topFrom: this.elements.topFromInput ? this.elements.topFromInput.value : '',
      topTo: this.elements.topToInput ? this.elements.topToInput.value : '',
      skuCount: this.elements.skuCountInput ? this.elements.skuCountInput.value : '',
      minLmPercent: this.elements.minLmPercentInput ? this.elements.minLmPercentInput.value : '',
      minStock: this.elements.minStockInput ? this.elements.minStockInput.value : '',
      priceType: this.elements.priceTypeSelect ? this.elements.priceTypeSelect.value : 'percent',
      priceValue: this.elements.priceValueInput ? this.elements.priceValueInput.value : '',
      campaignStock: this.elements.campaignStockInput ? this.elements.campaignStockInput.value : '',
      purchaseLimit: this.elements.purchaseLimitInput ? this.elements.purchaseLimitInput.value : ''
    };

    AutoFS.storage.saveConfig(AutoFS.CONFIG.STORAGE_KEYS.PORTAL_CONFIG, config);
  },

  bindConfigPersistence() {
    const inputs = [
      this.elements.topFromInput,
      this.elements.topToInput,
      this.elements.skuCountInput,
      this.elements.minLmPercentInput,
      this.elements.minStockInput,
      this.elements.priceTypeSelect,
      this.elements.priceValueInput,
      this.elements.campaignStockInput,
      this.elements.purchaseLimitInput
    ];

    inputs.forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => this.saveCurrentConfig());
      input.addEventListener('change', () => this.saveCurrentConfig());
    });
  }
};
