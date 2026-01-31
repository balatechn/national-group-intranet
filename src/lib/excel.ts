import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'email';
  example?: string;
}

export interface ExcelTemplate {
  sheetName: string;
  columns: ExcelColumn[];
  sampleData?: Record<string, any>[];
}

// Parse Excel file to JSON
export function parseExcelFile(file: ArrayBuffer): Record<string, any>[] {
  const workbook = XLSX.read(file, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  return data as Record<string, any>[];
}

// Generate Excel template for download
export function generateExcelTemplate(template: ExcelTemplate): Blob {
  const workbook = XLSX.utils.book_new();
  
  // Create header row with column names
  const headers = template.columns.map(col => col.header);
  
  // Create sample data rows
  const sampleRows = template.sampleData || [
    template.columns.reduce((row, col) => {
      row[col.header] = col.example || '';
      return row;
    }, {} as Record<string, any>)
  ];

  // Create worksheet from data
  const wsData = [headers, ...sampleRows.map(row => 
    template.columns.map(col => row[col.header] || row[col.key] || col.example || '')
  )];
  
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  worksheet['!cols'] = template.columns.map(col => ({ 
    wch: col.width || Math.max(col.header.length + 2, 15) 
  }));

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, template.sheetName);

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  return new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

// Validate Excel data against template
export function validateExcelData(
  data: Record<string, any>[],
  columns: ExcelColumn[]
): { valid: boolean; errors: string[]; validRows: Record<string, any>[] } {
  const errors: string[] = [];
  const validRows: Record<string, any>[] = [];
  const requiredColumns = columns.filter(col => col.required).map(col => col.header);

  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header row and 0-index
    let rowValid = true;
    const cleanRow: Record<string, any> = {};

    // Check required fields
    for (const reqCol of requiredColumns) {
      const value = row[reqCol];
      if (value === undefined || value === null || value === '') {
        errors.push(`Row ${rowNum}: Missing required field "${reqCol}"`);
        rowValid = false;
      }
    }

    // Validate and clean each column
    for (const col of columns) {
      const value = row[col.header];
      
      if (value !== undefined && value !== null && value !== '') {
        // Type validation
        switch (col.type) {
          case 'email':
            if (typeof value === 'string' && !isValidEmail(value)) {
              errors.push(`Row ${rowNum}: Invalid email format for "${col.header}"`);
              rowValid = false;
            }
            break;
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`Row ${rowNum}: "${col.header}" must be a number`);
              rowValid = false;
            }
            break;
          case 'date':
            if (!(value instanceof Date) && isNaN(Date.parse(value))) {
              errors.push(`Row ${rowNum}: Invalid date format for "${col.header}"`);
              rowValid = false;
            }
            break;
        }
        
        cleanRow[col.key] = value;
      }
    }

    if (rowValid) {
      validRows.push(cleanRow);
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors.slice(0, 20), // Limit to first 20 errors
    validRows
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Template definitions for each master type
export const EXCEL_TEMPLATES = {
  companies: {
    sheetName: 'Companies',
    columns: [
      { header: 'Company Code', key: 'code', required: true, example: 'COMP001' },
      { header: 'Company Name', key: 'name', required: true, example: 'Acme Corporation', width: 30 },
      { header: 'Short Name', key: 'shortName', example: 'Acme', width: 15 },
      { header: 'Description', key: 'description', example: 'Technology solutions provider', width: 40 },
      { header: 'Website', key: 'website', example: 'https://acme.com', width: 25 },
      { header: 'Email', key: 'email', type: 'email' as const, example: 'info@acme.com', width: 25 },
      { header: 'Phone', key: 'phone', example: '+91 80 1234 5678', width: 18 },
      { header: 'Address', key: 'address', example: '123 Main Street', width: 30 },
      { header: 'City', key: 'city', example: 'Bengaluru', width: 15 },
      { header: 'State', key: 'state', example: 'Karnataka', width: 15 },
      { header: 'Country', key: 'country', example: 'India', width: 12 },
      { header: 'Postal Code', key: 'postalCode', example: '560001', width: 12 },
      { header: 'Tax ID', key: 'taxId', example: '29AABCN1234A1Z5', width: 20 },
    ],
  } as ExcelTemplate,

  departments: {
    sheetName: 'Departments',
    columns: [
      { header: 'Department Code', key: 'code', required: true, example: 'IT-001' },
      { header: 'Department Name', key: 'name', required: true, example: 'Information Technology', width: 25 },
      { header: 'Description', key: 'description', example: 'IT & Digital Services', width: 35 },
      { header: 'Company Code', key: 'companyCode', required: true, example: 'NGI', width: 15 },
    ],
  } as ExcelTemplate,

  employees: {
    sheetName: 'Employees',
    columns: [
      { header: 'Employee ID', key: 'employeeId', required: true, example: 'EMP001' },
      { header: 'Email', key: 'email', required: true, type: 'email' as const, example: 'john.doe@company.com', width: 28 },
      { header: 'First Name', key: 'firstName', required: true, example: 'John', width: 15 },
      { header: 'Last Name', key: 'lastName', required: true, example: 'Doe', width: 15 },
      { header: 'Display Name', key: 'displayName', example: 'John Doe', width: 20 },
      { header: 'Phone', key: 'phone', example: '+91 98765 43210', width: 18 },
      { header: 'Job Title', key: 'jobTitle', example: 'Software Engineer', width: 22 },
      { header: 'Company Code', key: 'companyCode', required: true, example: 'NGI', width: 15 },
      { header: 'Department Code', key: 'departmentCode', example: 'NGI-IT', width: 18 },
      { header: 'Manager Email', key: 'managerEmail', type: 'email' as const, example: 'manager@company.com', width: 28 },
      { header: 'Role', key: 'role', example: 'EMPLOYEE', width: 15 },
    ],
  } as ExcelTemplate,

  systems: {
    sheetName: 'Systems',
    columns: [
      { header: 'Asset Tag', key: 'assetTag', required: true, example: 'SYS-LT-001' },
      { header: 'Name', key: 'name', required: true, example: 'Dell Latitude 5520', width: 25 },
      { header: 'Type', key: 'type', required: true, example: 'LAPTOP', width: 12 },
      { header: 'Manufacturer', key: 'manufacturer', example: 'Dell', width: 15 },
      { header: 'Model', key: 'model', example: 'Latitude 5520', width: 18 },
      { header: 'Serial Number', key: 'serialNumber', example: 'DELL123456', width: 18 },
      { header: 'Processor', key: 'processor', example: 'Intel Core i7', width: 18 },
      { header: 'RAM', key: 'ram', example: '16GB DDR4', width: 12 },
      { header: 'Storage', key: 'storage', example: '512GB SSD', width: 12 },
      { header: 'Operating System', key: 'operatingSystem', example: 'Windows 11 Pro', width: 18 },
      { header: 'Purchase Date', key: 'purchaseDate', type: 'date' as const, example: '2024-01-15', width: 14 },
      { header: 'Warranty Expiry', key: 'warrantyExpiry', type: 'date' as const, example: '2027-01-15', width: 14 },
      { header: 'Purchase Price', key: 'purchasePrice', type: 'number' as const, example: '85000', width: 14 },
      { header: 'Status', key: 'status', example: 'AVAILABLE', width: 14 },
      { header: 'Location', key: 'location', example: 'IT Department', width: 20 },
      { header: 'Assigned To Email', key: 'assignedToEmail', type: 'email' as const, example: 'user@company.com', width: 25 },
    ],
  } as ExcelTemplate,

  software: {
    sheetName: 'Software',
    columns: [
      { header: 'Software ID', key: 'id', required: true, example: 'SW-MS365-001' },
      { header: 'Name', key: 'name', required: true, example: 'Microsoft 365 Business', width: 28 },
      { header: 'Version', key: 'version', example: 'E3', width: 12 },
      { header: 'License Type', key: 'licenseType', required: true, example: 'SUBSCRIPTION', width: 15 },
      { header: 'Total Licenses', key: 'totalLicenses', type: 'number' as const, example: '100', width: 14 },
      { header: 'Used Licenses', key: 'usedLicenses', type: 'number' as const, example: '45', width: 14 },
      { header: 'License Key', key: 'licenseKey', example: 'XXXXX-XXXXX-XXXXX', width: 22 },
      { header: 'Purchase Date', key: 'purchaseDate', type: 'date' as const, example: '2024-01-01', width: 14 },
      { header: 'Expiry Date', key: 'expiryDate', type: 'date' as const, example: '2024-12-31', width: 14 },
      { header: 'Purchase Price', key: 'purchasePrice', type: 'number' as const, example: '500000', width: 14 },
      { header: 'Vendor Code', key: 'vendorCode', example: 'MS-001', width: 12 },
    ],
  } as ExcelTemplate,

  mobiles: {
    sheetName: 'Mobile Devices',
    columns: [
      { header: 'Asset Tag', key: 'assetTag', required: true, example: 'MOB-001' },
      { header: 'Device Name', key: 'name', required: true, example: 'iPhone 15 Pro', width: 22 },
      { header: 'Type', key: 'type', required: true, example: 'SMARTPHONE', width: 14 },
      { header: 'Manufacturer', key: 'manufacturer', example: 'Apple', width: 15 },
      { header: 'Model', key: 'model', example: 'iPhone 15 Pro', width: 18 },
      { header: 'Serial Number', key: 'serialNumber', example: 'APPLE123456', width: 18 },
      { header: 'IMEI', key: 'imei', example: '123456789012345', width: 18 },
      { header: 'Phone Number', key: 'phoneNumber', example: '+91 98765 43210', width: 18 },
      { header: 'Carrier', key: 'carrier', example: 'Airtel', width: 12 },
      { header: 'Operating System', key: 'operatingSystem', example: 'iOS 17', width: 15 },
      { header: 'Purchase Date', key: 'purchaseDate', type: 'date' as const, example: '2024-01-15', width: 14 },
      { header: 'Warranty Expiry', key: 'warrantyExpiry', type: 'date' as const, example: '2025-01-15', width: 14 },
      { header: 'Purchase Price', key: 'purchasePrice', type: 'number' as const, example: '150000', width: 14 },
      { header: 'Status', key: 'status', example: 'ASSIGNED', width: 12 },
      { header: 'Assigned To Email', key: 'assignedToEmail', type: 'email' as const, example: 'user@company.com', width: 25 },
    ],
  } as ExcelTemplate,

  vendors: {
    sheetName: 'Vendors',
    columns: [
      { header: 'Vendor Code', key: 'code', required: true, example: 'VEND-001' },
      { header: 'Vendor Name', key: 'name', required: true, example: 'Dell Technologies', width: 25 },
      { header: 'Type', key: 'type', example: 'Hardware', width: 12 },
      { header: 'Contact Person', key: 'contactPerson', example: 'John Smith', width: 18 },
      { header: 'Email', key: 'email', type: 'email' as const, example: 'contact@vendor.com', width: 25 },
      { header: 'Phone', key: 'phone', example: '+91 80 1234 5678', width: 18 },
      { header: 'Address', key: 'address', example: '123 Tech Park', width: 30 },
      { header: 'Website', key: 'website', example: 'https://vendor.com', width: 25 },
      { header: 'Contract End Date', key: 'contractEnd', type: 'date' as const, example: '2025-12-31', width: 16 },
      { header: 'Company Code', key: 'companyCode', required: true, example: 'NGI', width: 15 },
    ],
  } as ExcelTemplate,
};

// Export data to Excel
export function exportToExcel(
  data: Record<string, any>[],
  columns: ExcelColumn[],
  filename: string
): Blob {
  const workbook = XLSX.utils.book_new();
  
  // Create header row
  const headers = columns.map(col => col.header);
  
  // Map data to rows
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col.key];
      if (col.type === 'date' && value) {
        return new Date(value).toLocaleDateString();
      }
      return value ?? '';
    })
  );

  const wsData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  worksheet['!cols'] = columns.map(col => ({ 
    wch: col.width || Math.max(col.header.length + 2, 15) 
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  return new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}
