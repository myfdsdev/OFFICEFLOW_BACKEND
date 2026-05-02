import PDFDocument from 'pdfkit';
import { uploadToCloudinary } from '../config/cloudinary.js';

/**
 * Generate a PDF payslip and upload to Cloudinary
 * @param {Object} payslip - Payslip document from database
 * @param {Object} user - User document
 * @param {Object} appSettings - AppSettings document
 * @returns {Promise<string>} Cloudinary URL
 */
export const generatePayslipPDF = async (payslip, user, appSettings) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);

        // Upload to Cloudinary
        const fileName = `payslip-${payslip.employee_email}-${payslip.month}.pdf`;
        const result = await uploadToCloudinary(pdfBuffer, 'payslips');

        resolve(result.secure_url);
      });
      doc.on('error', (err) => reject(err));

      // ===== Header Section =====
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Company Logo (if available)
      if (appSettings.app_logo) {
        try {
          const response = await fetch(appSettings.app_logo);
          const logoBuffer = Buffer.from(await response.arrayBuffer());
          doc.image(logoBuffer, 40, 30, { width: 50, height: 50 });
        } catch (err) {
          console.warn('Could not load logo:', err.message);
        }
      }

      // Company name and title
      doc
        .font('Helvetica-Bold')
        .fontSize(18)
        .text(appSettings.app_name || 'AttendEase', 100, 35);
      doc
        .font('Helvetica')
        .fontSize(10)
        .text('SALARY PAYSLIP', 100, 60);

      // Payslip month and ID
      const monthName = new Date(`${payslip.month}-01`).toLocaleDateString(
        'en-US',
        { month: 'long', year: 'numeric' }
      );
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(`For: ${monthName}`, 400, 35);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 400, 50);

      // Separator line
      doc
        .moveTo(40, 95)
        .lineTo(pageWidth - 40, 95)
        .stroke();

      // ===== Employee Information Section =====
      let yPos = 110;

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Employee Information', 40, yPos);
      yPos += 20;

      const infoStartX = 40;
      const infoLabelWidth = 120;
      const infoValueX = infoStartX + infoLabelWidth;

      doc.font('Helvetica').fontSize(9);

      const infoFields = [
        ['Name', payslip.employee_name],
        ['Email', payslip.employee_email],
        ['Employee ID', user.employee_id || 'N/A'],
        ['Department', user.department || 'N/A'],
      ];

      infoFields.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(label + ':', infoStartX, yPos, {
          width: infoLabelWidth,
        });
        doc.font('Helvetica').text(value, infoValueX, yPos);
        yPos += 15;
      });

      yPos += 10;

      // ===== Attendance Summary =====
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Attendance Summary', 40, yPos);
      yPos += 15;

      const attendanceFields = [
        ['Days Present', payslip.days_present],
        ['Days Late', payslip.days_late],
        ['Half-Day', payslip.days_half_day],
        ['Days Absent', payslip.days_absent],
        ['Paid Leaves', payslip.paid_leaves],
        ['Unpaid Leaves', payslip.unpaid_leaves],
      ];

      doc.font('Helvetica').fontSize(8);
      const attendCol1X = 40;
      const attendCol2X = 150;
      const attendCol3X = 250;
      const attendCol4X = 360;

      for (let i = 0; i < attendanceFields.length; i += 2) {
        const [label1, value1] = attendanceFields[i];
        const [label2, value2] = attendanceFields[i + 1] || [
          '',
          '',
        ];

        doc
          .font('Helvetica-Bold')
          .text(label1 + ':', attendCol1X, yPos, { width: 100 });
        doc.font('Helvetica').text(String(value1), attendCol2X, yPos);

        if (label2) {
          doc
            .font('Helvetica-Bold')
            .text(label2 + ':', attendCol3X, yPos, { width: 100 });
          doc.font('Helvetica').text(String(value2), attendCol4X, yPos);
        }

        yPos += 12;
      }

      yPos += 10;

      // ===== Earnings Section =====
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('EARNINGS', 40, yPos);
      yPos += 12;

      // Table header
      const tableX = 40;
      const tableLabelWidth = 200;
      const tableValueWidth = 80;
      const tableAmountX = tableX + tableValueWidth + 120;

      doc.font('Helvetica').fontSize(8);

      const drawTableRow = (label, amount, isBold = false) => {
        const font = isBold ? 'Helvetica-Bold' : 'Helvetica';
        doc
          .font(font)
          .text(label, tableX, yPos, { width: tableValueWidth + 120 });
        doc.font(font).text(
          `${appSettings.currency_symbol || '₹'}${Number(amount || 0).toFixed(2)}`,
          tableAmountX,
          yPos,
          { align: 'right', width: 60 }
        );
        yPos += 10;
      };

      drawTableRow('Base Salary', payslip.base_salary);
      if (payslip.allowances.hra)
        drawTableRow('House Rent Allowance', payslip.allowances.hra);
      if (payslip.allowances.travel)
        drawTableRow('Travel Allowance', payslip.allowances.travel);
      if (payslip.allowances.other)
        drawTableRow('Other Allowances', payslip.allowances.other);
      if (payslip.overtime_hours > 0) {
        drawTableRow(
          `Overtime (${payslip.overtime_hours.toFixed(2)} hrs)`,
          payslip.overtime_pay
        );
      }
      if (payslip.bonus > 0) drawTableRow('Bonus', payslip.bonus);

      // Separator
      doc.moveTo(tableX, yPos).lineTo(tableAmountX + 60, yPos).stroke();
      yPos += 8;

      drawTableRow('Gross Salary', payslip.gross_salary, true);

      yPos += 10;

      // ===== Deductions Section =====
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('DEDUCTIONS', 40, yPos);
      yPos += 12;

      doc.font('Helvetica').fontSize(8);

      if (payslip.late_deduction > 0) {
        drawTableRow(`Late Penalty (${payslip.days_late} days)`, payslip.late_deduction);
      }
      if (payslip.half_day_deduction > 0) {
        drawTableRow(
          `Half-Day Deduction (${payslip.days_half_day} days)`,
          payslip.half_day_deduction
        );
      }
      if (payslip.absent_deduction > 0) {
        drawTableRow(
          `Absent Deduction (${payslip.days_absent} days)`,
          payslip.absent_deduction
        );
      }
      if (payslip.unpaid_leave_deduction > 0) {
        drawTableRow(
          `Unpaid Leave (${payslip.unpaid_leaves} days)`,
          payslip.unpaid_leave_deduction
        );
      }

      if (payslip.total_deductions > 0) {
        // Separator
        doc.moveTo(tableX, yPos).lineTo(tableAmountX + 60, yPos).stroke();
        yPos += 8;

        drawTableRow(
          'Total Deductions',
          payslip.total_deductions,
          true
        );
      }

      yPos += 15;

      // ===== Net Salary (Highlighted) =====
      const netBoxX = tableX;
      const netBoxWidth = tableValueWidth + 120 + 60 + 20;
      const netBoxHeight = 35;

      doc
        .rect(netBoxX, yPos, netBoxWidth, netBoxHeight)
        .fill('#f3f4f6')
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('NET SALARY', netBoxX + 10, yPos + 5);
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text(
          `${appSettings.currency_symbol || '₹'}${Number(payslip.net_salary || 0).toFixed(2)}`,
          netBoxX + 10,
          yPos + 18
        );

      yPos += 45;

      // ===== Payment Information =====
      if (payslip.status === 'paid') {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('Payment Information', 40, yPos);
        yPos += 12;

        doc.font('Helvetica').fontSize(8);
        const paymentFields = [
          [
            'Payment Method',
            payslip.payment_method || 'N/A',
          ],
          [
            'Transaction ID',
            payslip.transaction_id || 'N/A',
          ],
          [
            'Paid Date',
            payslip.paid_date
              ? new Date(payslip.paid_date).toLocaleDateString()
              : 'N/A',
          ],
        ];

        paymentFields.forEach(([label, value]) => {
          doc
            .font('Helvetica-Bold')
            .text(label + ':', 40, yPos, { width: 120 });
          doc.font('Helvetica').text(value, 160, yPos);
          yPos += 12;
        });

        yPos += 15;
      }

      // ===== Footer =====
      yPos = pageHeight - 60;

      doc
        .moveTo(40, yPos)
        .lineTo(pageWidth - 40, yPos)
        .stroke();

      yPos += 10;

      doc.font('Helvetica').fontSize(8).text(
        `Generated on: ${new Date().toLocaleDateString()} | Status: ${payslip.status.toUpperCase()}`,
        40,
        yPos
      );

      yPos += 10;

      doc.text(
        `This is a computer-generated document and does not require a signature.`,
        40,
        yPos
      );

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};
