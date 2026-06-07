import type { PayrollRow } from "@/lib/payroll";

export type PayrollExportFormat = "pohoda" | "sage" | "money_s3" | "csv";

export function exportPayroll(
  format: PayrollExportFormat,
  rows: PayrollRow[],
  year: number,
  month: number,
  branchName = "ShiftMind"
): { content: string; mime: string; filename: string } {
  switch (format) {
    case "pohoda":
      return exportPohodaXml(rows, year, month, branchName);
    case "sage":
      return exportSageCsv(rows, year, month);
    case "money_s3":
      return exportMoneyS3Csv(rows, year, month);
    default:
      return {
        content: "",
        mime: "text/csv",
        filename: `payroll-${year}-${String(month).padStart(2, "0")}.csv`,
      };
  }
}

function exportPohodaXml(
  rows: PayrollRow[],
  year: number,
  month: number,
  branchName: string
) {
  const period = `${year}-${String(month).padStart(2, "0")}`;
  const items = rows
    .map(
      (r) => `
    <Mzda>
      <Zamestnanec>${escapeXml(r.name)}</Zamestnanec>
      <OdpracovaneHodiny>${r.actualHours}</OdpracovaneHodiny>
      <Nadcasy>${r.overtimeHours}</Nadcasy>
      <Stravne>${r.mealAllowance}</Stravne>
      <Naklad>${r.laborCost}</Naklad>
      <Absencie>${r.absenceDays}</Absencie>
    </Mzda>`
    )
    .join("");

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<MoneyData>
  <Export>
    <Program>ShiftMind</Program>
    <Prevadzka>${escapeXml(branchName)}</Prevadzka>
    <Obdobie>${period}</Obdobie>
    <Mzdy>${items}
    </Mzdy>
  </Export>
</MoneyData>`;

  return {
    content,
    mime: "application/xml",
    filename: `pohoda-mzdy-${period}.xml`,
  };
}

function exportSageCsv(rows: PayrollRow[], year: number, month: number) {
  const header =
    "Employee ID,Employee Name,Regular Hours,Overtime Hours,Absence Days,Meal Allowance,Gross Cost,Period";
  const period = `${year}-${String(month).padStart(2, "0")}`;
  const lines = rows.map(
    (r) =>
      `${r.employeeId},${escapeCsv(r.name)},${r.actualHours},${r.overtimeHours},${r.absenceDays},${r.mealAllowance},${r.laborCost},${period}`
  );
  return {
    content: [header, ...lines].join("\n"),
    mime: "text/csv",
    filename: `sage-payroll-${period}.csv`,
  };
}

function exportMoneyS3Csv(rows: PayrollRow[], year: number, month: number) {
  const header =
    "Meno;Odpracovane_h;Nadcasy_h;Absencie_dni;Stravne_EUR;Celkom_EUR;Obdobie";
  const period = `${String(month).padStart(2, "0")}/${year}`;
  const lines = rows.map(
    (r) =>
      `${r.name};${r.actualHours};${r.overtimeHours};${r.absenceDays};${r.mealAllowance};${r.laborCost};${period}`
  );
  return {
    content: [header, ...lines].join("\n"),
    mime: "text/csv;charset=windows-1250",
    filename: `money-s3-${year}-${String(month).padStart(2, "0")}.csv`,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadPayrollExport(
  format: PayrollExportFormat,
  rows: PayrollRow[],
  year: number,
  month: number,
  branchName?: string
) {
  const { content, mime, filename } = exportPayroll(
    format,
    rows,
    year,
    month,
    branchName
  );
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
