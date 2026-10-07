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
   * Save 2D Array workbook directly as .xlsx file
   */
  writeExcelAOA(aoaData, fileName = 'Template FS Shopee.xlsx', sheetName = 'Template FS Shopee') {
    const workbook = this.createWorkbook(aoaData, sheetName);
    XLSX.writeFile(workbook, fileName);
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
