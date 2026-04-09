import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export const exportToExcel = async (transactions) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'Petty Cash Manager';
  workbook.created = new Date();

  // MAIN TRANSACTIONS SHEET
  const worksheet = workbook.addWorksheet('Transactions', {
    pageSetup: { paperSize: 9, orientation: 'landscape' }
  });

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Description', key: 'description', width: 35 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Employee', key: 'employee', width: 20 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Amount (LKR)', key: 'amount', width: 18 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];

  transactions.forEach((t) => {
    const row = worksheet.addRow({
      date: format(new Date(t.date), 'yyyy-MM-dd'),
      type: t.type === 'ALLOCATION' ? 'Allocation' : 'Expense',
      description: t.description,
      category: t.category || 'General',
      employee: t.employee?.name || 'N/A',
      department: t.department?.name || 'N/A',
      status: t.approvalStatus,
      amount: t.amount,
      notes: t.notes || '',
    });

    // Color code amount by type
    if (t.type === 'ALLOCATION') {
      row.getCell('amount').font = {
        color: { argb: 'FF059669' },
        bold: true
      };
    } else {
      row.getCell('amount').font = {
        color: { argb: 'FFDC2626' },
        bold: true
      };
    }
  });

  const headerRow = worksheet.getRow(1);
  headerRow.font = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    size: 11
  };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }
  };
  headerRow.height = 20;
  headerRow.alignment = {
    vertical: 'middle',
    horizontal: 'center'
  };

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // SUMMARY SECTION
  const totalAllocated = transactions
    .filter(t => t.type === 'ALLOCATION' &&
      t.approvalStatus === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE' &&
      t.approvalStatus === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalAllocated - totalExpense;

  worksheet.addRow([]);
  const summaryStartRow = worksheet.rowCount + 1;

  worksheet.addRow(['SUMMARY', '', '', '', '', '', '', '', '']);
  worksheet.addRow([
    'Total Allocated', '', '', '', '', '', '', totalAllocated, ''
  ]);
  worksheet.addRow([
    'Total Expense', '', '', '', '', '', '', totalExpense, ''
  ]);
  worksheet.addRow([
    'Balance', '', '', '', '', '', '', balance, ''
  ]);

  // Style summary rows
  for (let i = summaryStartRow; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    row.font = { bold: true };

    if (i === summaryStartRow) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' }
      };
    }

    const amountCell = row.getCell(8);
    if (i === summaryStartRow + 1) {
      amountCell.font = {
        bold: true,
        color: { argb: 'FF059669' }
      };
    } else if (i === summaryStartRow + 2) {
      amountCell.font = {
        bold: true,
        color: { argb: 'FFDC2626' }
      };
    } else if (i === summaryStartRow + 3) {
      amountCell.font = {
        bold: true,
        color: {
          argb: balance >= 0 ? 'FF059669' : 'FFDC2626'
        }
      };
    }
  }

  // SUMMARY SHEET - Expense by Category
  const summarySheet = workbook.addWorksheet('Category Summary');

  const expenseByCategory = transactions
    .filter(t => t.type === 'EXPENSE' &&
      t.approvalStatus === 'approved')
    .reduce((acc, t) => {
      acc[t.category || 'General'] =
        (acc[t.category || 'General'] || 0) + t.amount;
      return acc;
    }, {});

  summarySheet.addRow(['EXPENSE BY CATEGORY']);
  summarySheet.addRow(['Category', 'Amount (LKR)']);

  Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, amount]) => {
      summarySheet.addRow([category, amount]);
    });

  summarySheet.getRow(1).font = { bold: true, size: 14 };
  summarySheet.getRow(2).font = { bold: true };
  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 20;

  // SAVE FILE
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const fileName = `PettyCash_Report_${format(
    new Date(),
    'yyyy-MM-dd_HHmmss'
  )}.xlsx`;

  saveAs(blob, fileName);
  return fileName;
};