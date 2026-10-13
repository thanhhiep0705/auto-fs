/**
 * Auto FS - Exporter Service (Excel & ZIP)
 */
window.AutoFS = window.AutoFS || {};

AutoFS.exporter = {
  /**
   * Create an Excel workbook with custom sheet name and headers
   */
  createWorkbook(exportRows, sheetName = 'Flash Sale', headers = ['Mã sản phẩm', 'Mã phân loại hàng', 'Giá đã giảm']) {
    if (typeof XLSX === 'undefined') {
      throw new Error('Thư viện XLSX chưa được tải. Hãy kiểm tra kết nối mạng.');
    }

    let worksheet;
    if (Array.isArray(exportRows) && Array.isArray(exportRows[0])) {
      worksheet = XLSX.utils.aoa_to_sheet(exportRows);
    } else {
      worksheet = XLSX.utils.json_to_sheet(exportRows, {
        header: headers
      });
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return workbook;
  },

  /**
   * Build binary workbook data array
   */
  buildWorkbookData(exportRows, sheetName = 'Flash Sale', headers) {
    const workbook = this.createWorkbook(exportRows, sheetName, headers);
    return XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
  },

  /**
   * Save workbook directly as .xlsx file
   */
  writeExcel(exportRows, fileName = 'Flash Sale.xlsx', sheetName = 'Flash Sale', headers) {
    const workbook = this.createWorkbook(exportRows, sheetName, headers);
    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Save 2D Array workbook directly as .xlsx file matching Shopee Portal template format
   */
  writeExcelAOA(aoaData, fileName = 'eligible_Product_list.xlsx', sheetName = 'Sheet1') {
    const workbook = this.createWorkbook(aoaData, sheetName);
    const worksheet = workbook.Sheets[sheetName];

    if (worksheet) {
      // Ensure cells have correct string formatting matching Shopee Portal specs
      for (const cellRef of Object.keys(worksheet)) {
        if (cellRef.startsWith('!')) continue;
        const cell = worksheet[cellRef];
        if (!cell || cell.v === undefined || cell.v === null) continue;

        // Header rows (rows 1, 2, 3) are always strings
        const rowNum = parseInt(cellRef.replace(/^[A-Z]+/, ''), 10);
        if (rowNum <= 3) {
          cell.t = 's';
          cell.v = String(cell.v);
        } else {
          // Column I (Doanh số) can be numeric 0
          if (cellRef.startsWith('I')) {
            cell.t = 'n';
            cell.v = Number(cell.v) || 0;
          } else {
            // All other columns (IDs, product names, prices, stocks, limits) must be formatted as strings
            cell.t = 's';
            cell.v = String(cell.v);
          }
        }
      }
    }

    XLSX.writeFile(workbook, fileName, {
      bookType: 'xlsx',
      bookSST: true
    });
  },

  /**
   * Create a new JSZip archive instance
   */
  createZipArchive() {
    if (typeof JSZip === 'undefined') {
      throw new Error('Chưa tải được thư viện ZIP. Hãy kiểm tra kết nối mạng rồi tải lại trang.');
    }
    return new JSZip();
  },

  /**
   * Download a JSZip instance as a .zip file
   */
  async writeZipFile(zip, fileName) {
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
};
