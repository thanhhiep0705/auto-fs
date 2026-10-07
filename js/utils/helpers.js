/**
 * Auto FS - Helper Utilities
 */
window.AutoFS = window.AutoFS || {};

AutoFS.helpers = {
  /**
   * Trim and normalize cell values
   */
  cleanCell(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  },

  /**
   * Normalize header string for loose matching (remove accents, lowercase)
   */
  normalizeHeader(value) {
    return this.cleanCell(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Parse price from text/number string
   */
  parsePrice(price) {
    const normalizedPrice = this.cleanCell(price).replace(/[^\d.-]/g, '');
    const numericPrice = Number(normalizedPrice);

    if (!Number.isFinite(numericPrice)) {
      throw new Error(`Giá không hợp lệ: ${price}`);
    }

    return numericPrice;
  },

  /**
   * Adjust price by an offset amount
   */
  adjustPrice(price, adjustment) {
    const numericPrice = this.parsePrice(price);
    const adjustedPrice = numericPrice + adjustment;

    if (adjustedPrice < 0) {
      throw new Error('Giá sau khi điều chỉnh không được nhỏ hơn 0.');
    }

    return adjustedPrice;
  },

  /**
   * Parse numeric values with support for international separators
   */
  parseOptionalNumber(value) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    const text = this.cleanCell(value);
    if (!text || text === '-') return null;

    const normalizedText = text
      .replace(/\s/g, '')
      .replace(/[^\d,.-]/g, '');

    if (!normalizedText) return null;

    const lastComma = normalizedText.lastIndexOf(',');
    const lastDot = normalizedText.lastIndexOf('.');
    let numericText = normalizedText;

    if (lastComma > -1 && lastDot > -1) {
      const decimalSeparator = lastComma > lastDot ? ',' : '.';
      const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
      numericText = normalizedText
        .replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '')
        .replace(decimalSeparator, '.');
    } else if (lastComma > -1) {
      numericText = this.normalizeSingleSeparatorNumber(normalizedText, ',');
    } else if (lastDot > -1) {
      numericText = this.normalizeSingleSeparatorNumber(normalizedText, '.');
    }

    const number = Number(numericText);
    return Number.isFinite(number) ? number : null;
  },

  /**
   * Parse % LM percentage string into numeric value
   * Handles formats like " - 30.66% ▼", " 0.47% ▲", "-20%", "15.5%"
   */
  parseLmPercent(value) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    const text = this.cleanCell(value);
    if (!text || text === '-') return null;

    const isNegative = text.includes('-') || text.includes('▼');
    const numericPart = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    const num = parseFloat(numericPart);
    if (isNaN(num)) return null;
    return isNegative ? -Math.abs(num) : Math.abs(num);
  },

  normalizeSingleSeparatorNumber(value, separator) {
    const parts = value.split(separator);

    if (parts.length > 2 || parts.at(-1).length === 3) {
      return parts.join('');
    }

    if (separator === ',') {
      return value.replace(',', '.');
    }

    return value;
  },

  /**
   * Validation helpers for form inputs
   */
  readPositiveInteger(input, label) {
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`${label} phải là số nguyên từ 1 trở lên.`);
    }
    return value;
  },

  readOptionalPositiveInteger(input, label) {
    if (input.value.trim() === '') {
      return Infinity;
    }
    return this.readPositiveInteger(input, label);
  },

  readNonNegativeInteger(input, label) {
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${label} phải là số nguyên từ 0 trở lên.`);
    }
    return value;
  },

  readPriceAdjustment(input, label = 'Điều chỉnh giá') {
    const rawValue = input.value.trim();
    if (rawValue === '') return 0;

    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      throw new Error(`${label} phải là một số hợp lệ.`);
    }

    return value;
  },

  /**
   * Format numbers and dates
   */
  formatBatchNumber(number) {
    return String(number).padStart(2, '0');
  },

  getFileDateStamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  },

  getFileTimeStamp() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${day}-${month}_${hours}h${minutes}`;
  },

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  waitForNextFrame() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }
};
