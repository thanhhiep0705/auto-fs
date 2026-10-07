/**
 * Auto FS - Google Sheet Service
 */
window.AutoFS = window.AutoFS || {};

AutoFS.googleSheet = {
  /**
   * Load rows from Google Sheet via JSONP gviz API
   */
  loadRows(options = {}) {
    return new Promise((resolve, reject) => {
      const sheetId = options.sheetId || AutoFS.CONFIG.GOOGLE_SHEET_ID;
      const gid = options.gid || AutoFS.CONFIG.GOOGLE_SHEET_GID;
      const timeoutMs = options.timeoutMs || AutoFS.CONFIG.SHEET_REQUEST_TIMEOUT_MS;

      const callbackName = `googleSheetCallback_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const script = document.createElement('script');

      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('Google Sheet phản hồi quá lâu. Kiểm tra kết nối mạng hoặc quyền share của sheet.'));
      }, timeoutMs);

      window[callbackName] = response => {
        cleanup();

        try {
          if (!response || response.status === 'error') {
            const message = response && response.errors && response.errors[0]
              ? response.errors[0].detailed_message || response.errors[0].message
              : 'Không đọc được dữ liệu Google Sheet.';
            reject(new Error(message));
            return;
          }

          resolve(this.convertGoogleTableToRows(response.table));
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('Không tải được Google Sheet. Sheet cần được share "Anyone with the link can view".'));
      };

      const query = new URLSearchParams({
        tqx: `out:json;responseHandler:${callbackName}`
      });

      if (gid) {
        query.set('gid', gid);
      }

      if (options.sheetName) {
        query.set('sheet', options.sheetName);
      }

      script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?${query.toString()}`;
      document.body.appendChild(script);

      function cleanup() {
        window.clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      }
    });
  },

  /**
   * Convert Google Table format to standard 2D array of rows
   */
  convertGoogleTableToRows(table) {
    if (!table || !Array.isArray(table.rows)) {
      throw new Error('Dữ liệu Google Sheet không đúng định dạng.');
    }

    const header = table.cols.map(col => AutoFS.helpers.cleanCell(col.label || col.id));
    const body = table.rows.map(row =>
      table.cols.map((_, index) => {
        const cell = row.c && row.c[index];
        if (!cell) return '';
        return AutoFS.helpers.cleanCell(cell.f || cell.v);
      })
    );

    return [header, ...body];
  },

  /**
   * Parse Pivot rows for Flash Sale products and variants
   */
  parsePivotRows(rows) {
    const normalize = AutoFS.helpers.normalizeHeader.bind(AutoFS.helpers);
    const clean = AutoFS.helpers.cleanCell.bind(AutoFS.helpers);
    const parseNumber = AutoFS.helpers.parseOptionalNumber.bind(AutoFS.helpers);

    const headerIndex = rows.findIndex(row =>
      row.some(cell => normalize(cell) === 'ma san pham') &&
      row.some(cell => normalize(cell).includes('ma phan loai')) &&
      row.some(cell => normalize(cell).includes('gia'))
    );

    if (headerIndex === -1) {
      throw new Error('Không tìm thấy dòng tiêu đề gồm Mã sản phẩm, Mã phân loại hàng, Giá đã giảm.');
    }

    const headers = rows[headerIndex].map(normalize);
    const productCol = headers.findIndex(header => header === 'ma san pham');
    const productNameCol = headers.findIndex(header => header === 'san pham' || header.includes('ten san pham'));
    const variantCol = headers.findIndex(header => header.includes('ma phan loai'));
    const variantNameCol = headers.findIndex(header => header.includes('ten phan loai'));
    const priceCol = headers.findIndex(header => header.includes('gia'));
    const totalInventoryCol = headers.findIndex(header => header.includes('tong ton kho'));
    const revenueCol = headers.findIndex(header => header.includes('doanh so'));
    const lmCol = headers.findIndex(header => header.includes('lm') || header.includes('tang truong'));

    if (productCol === -1 || variantCol === -1 || priceCol === -1 || totalInventoryCol === -1) {
      throw new Error('Thiếu cột bắt buộc trong file. Sheet Pivot Table cần có Mã sản phẩm, Mã phân loại hàng, Giá đã giảm và Tổng Tồn Kho.');
    }

    const products = [];
    let currentProduct = null;

    for (const row of rows.slice(headerIndex + 1)) {
      const productId = clean(row[productCol]);
      const productName = productNameCol > -1 ? clean(row[productNameCol]) : '';
      const variantId = clean(row[variantCol]);
      const variantName = variantNameCol > -1 ? clean(row[variantNameCol]) : '';
      const price = clean(row[priceCol]);
      const totalInventory = parseNumber(row[totalInventoryCol]);
      const revenue = revenueCol > -1 ? parseNumber(row[revenueCol]) : 0;
      const lmValue = lmCol > -1 ? parseNumber(row[lmCol]) : null;

      if (productId && productId.toLowerCase() !== 'grand total') {
        currentProduct = {
          productId,
          productName: productName || `Sản phẩm ${productId}`,
          rank: products.length + 1,
          variants: []
        };
        products.push(currentProduct);
      }

      if (!currentProduct || !variantId || variantId === '-' || !price) {
        continue;
      }

      currentProduct.variants.push({
        variantId,
        variantName: variantName || variantId,
        price,
        totalInventory: totalInventory === null ? 0 : totalInventory,
        revenue: revenue || 0,
        lmGrowth: lmValue
      });
    }

    return products.filter(product => product.variants.length > 0);
  },

  /**
   * Parse rows specifically from 'This Month' sheet tab
   */
  parseThisMonthRows(rows) {
    const normalize = AutoFS.helpers.normalizeHeader.bind(AutoFS.helpers);
    const clean = AutoFS.helpers.cleanCell.bind(AutoFS.helpers);
    const parseNumber = AutoFS.helpers.parseOptionalNumber.bind(AutoFS.helpers);
    const parseLm = AutoFS.helpers.parseLmPercent.bind(AutoFS.helpers);

    const headerIndex = rows.findIndex(row =>
      row.some(cell => normalize(cell) === 'ma san pham') &&
      row.some(cell => normalize(cell).includes('ma phan loai'))
    );

    if (headerIndex === -1) {
      throw new Error('Không tìm thấy dòng tiêu đề trong sheet "This Month".');
    }

    const headers = rows[headerIndex].map(normalize);
    const productCol = headers.findIndex(header => header === 'ma san pham');
    const productNameCol = headers.findIndex(header => header === 'san pham' || header.includes('ten san pham'));
    const variantCol = headers.findIndex(header => header.includes('ma phan loai'));
    const variantNameCol = headers.findIndex(header => header.includes('ten phan loai'));
    const priceCol = headers.findIndex(header => header.includes('gia khuyen mai') || header.includes('gia da giam') || header === 'gia');
    const stockCol = headers.findIndex(header => header === 'stock' || header.includes('ton kho'));
    const lmCol = headers.findIndex(header => header.includes('%lm') || header.includes('lm') || header.includes('tang truong'));
    const revenueCol = headers.findIndex(header => header.includes('doanh so'));

    const products = [];
    const productMap = new Map();

    for (const row of rows.slice(headerIndex + 1)) {
      const productId = clean(row[productCol]);
      const productName = productNameCol > -1 ? clean(row[productNameCol]) : '';
      const variantId = variantCol > -1 ? clean(row[variantCol]) : '';
      const variantName = variantNameCol > -1 ? clean(row[variantNameCol]) : '';
      const price = priceCol > -1 ? clean(row[priceCol]) : '';
      const stock = stockCol > -1 ? parseNumber(row[stockCol]) : 0;
      const lmValue = lmCol > -1 ? parseLm(row[lmCol]) : null;
      const revenue = revenueCol > -1 ? parseNumber(row[revenueCol]) : 0;

      if (!productId || productId.toLowerCase() === 'grand total') {
        continue;
      }

      let currentProduct = productMap.get(productId);
      if (!currentProduct) {
        currentProduct = {
          productId,
          productName: productName || `Sản phẩm ${productId}`,
          rank: products.length + 1,
          variants: []
        };
        productMap.set(productId, currentProduct);
        products.push(currentProduct);
      } else if (productName && !currentProduct.productName) {
        currentProduct.productName = productName;
      }

      if (!variantId || variantId === '-' || !price) {
        continue;
      }

      currentProduct.variants.push({
        variantId,
        variantName: variantName || variantId,
        price,
        totalInventory: stock === null ? 0 : stock,
        revenue: revenue || 0,
        lmGrowth: lmValue
      });
    }

    const validProducts = products.filter(product => product.variants.length > 0);

    // Sắp xếp các phân loại trong từng sản phẩm theo doanh thu giảm dần & tính tổng doanh thu sản phẩm
    for (const product of validProducts) {
      product.variants.sort((a, b) => (Number(b.revenue) || 0) - (Number(a.revenue) || 0));
      product.totalRevenue = product.variants.reduce((sum, v) => sum + (Number(v.revenue) || 0), 0);
    }

    // Sắp xếp tất cả sản phẩm theo tổng doanh thu giảm dần
    validProducts.sort((a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0));

    // Cập nhật lại thứ hạng (Rank) chính xác theo doanh thu giảm dần
    validProducts.forEach((product, index) => {
      product.rank = index + 1;
    });

    return validProducts;
  }
};
