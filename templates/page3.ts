import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { ReportData } from "../types";
import { COLORS, globalStyles, renderFooter, renderTableCell } from "./helpers";

const styles = StyleSheet.create({
  titleContainer: {
    backgroundColor: COLORS.primary,
    padding: 6,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridBox: {
    width: "48%",
    marginBottom: 15,
  },
  fullGridBox: {
    width: "100%",
    marginBottom: 15,
  },
});

export function renderPage3(data: ReportData) {
  // Extract Year columns from the yearly table
  const yearlyTable = data["Yearly Financial Table"] || [];

  return React.createElement(
    Page,
    { size: "A4", style: globalStyles.page, key: "page3" },
    [
      // Geojit Style Top Header
      React.createElement(View, { style: globalStyles.header }, [
        React.createElement(View, { style: globalStyles.headerLeft }, [
          React.createElement(Text, { style: globalStyles.headerTitle }, "Retail Equity Research"),
          React.createElement(Text, { style: globalStyles.companyName }, data.Company),
        ]),
        React.createElement(Text, { style: { fontSize: 8, color: COLORS.lightText } }, "Consolidated Financial Statements"),
      ]),

      // Section Title
      React.createElement(View, { style: styles.titleContainer }, [
        React.createElement(Text, {}, "Consolidated Financials"),
      ]),

      // 2x2 Layout Grid
      React.createElement(View, { style: styles.gridContainer }, [
        // 1. Profit & Loss Summary (Full width or left column depending on space)
        React.createElement(View, { style: styles.fullGridBox }, [
          React.createElement(Text, { style: globalStyles.sectionTitle }, "Annual Profit & Loss Summary"),
          React.createElement(View, { style: globalStyles.table }, [
            // Headers
            React.createElement(View, { style: [globalStyles.tableRow, globalStyles.tableHeader] }, [
              renderTableCell("Yearly Metrics (Rs. cr)", "30%", "left", true),
              ...(yearlyTable[0]
                ? Object.keys(yearlyTable[0])
                    .filter((k) => k !== "Metric" && k !== "metrics")
                    .map((header) => renderTableCell(header, "17.5%", "right", true))
                : []),
            ]),
            // Rows
            ...yearlyTable.map((row, rIdx) => {
              const keys = Object.keys(row);
              const metricKey = keys.find((k) => k.toLowerCase() === "metric" || k.toLowerCase() === "metrics") || keys[0];
              const valKeys = keys.filter((k) => k !== metricKey);
              
              return React.createElement(View, { style: globalStyles.tableRow, key: rIdx }, [
                renderTableCell(String(row[metricKey]), "30%", "left", true),
                ...valKeys.map((key) => renderTableCell(String(row[key]), "17.5%", "right")),
              ]);
            }),
          ]),
        ]),

        // 2. Financial Ratios Summary (Left Box)
        React.createElement(View, { style: styles.gridBox }, [
          React.createElement(Text, { style: globalStyles.sectionTitle }, "Profitability & Valuation Ratios"),
          React.createElement(View, { style: globalStyles.table }, [
            React.createElement(View, { style: [globalStyles.tableRow, globalStyles.tableHeader] }, [
              renderTableCell("Ratio Name", "60%", "left", true),
              renderTableCell("Value", "40%", "right", true),
            ]),
            ...Object.entries(data.Ratios || {}).map(([key, val]) =>
              React.createElement(View, { style: globalStyles.tableRow, key }, [
                renderTableCell(key, "60%", "left"),
                renderTableCell(String(val), "40%", "right"),
              ])
            ),
          ]),
        ]),

        // 3. Balance Sheet Summary Metrics (Right Box)
        React.createElement(View, { style: styles.gridBox }, [
          React.createElement(Text, { style: globalStyles.sectionTitle }, "Key Balance Sheet Metrics"),
          React.createElement(View, { style: globalStyles.table }, [
            React.createElement(View, { style: [globalStyles.tableRow, globalStyles.tableHeader] }, [
              renderTableCell("Capital Metric", "60%", "left", true),
              renderTableCell("Value", "40%", "right", true),
            ]),
            React.createElement(View, { style: globalStyles.tableRow }, [
              renderTableCell("Market Cap", "60%", "left", true),
              renderTableCell(data["Market Cap"], "40%", "right"),
            ]),
            React.createElement(View, { style: globalStyles.tableRow }, [
              renderTableCell("Total Debt", "60%", "left", true),
              renderTableCell(data.Debt, "40%", "right"),
            ]),
            React.createElement(View, { style: globalStyles.tableRow }, [
              renderTableCell("Cash & Cash Equivalents", "60%", "left", true),
              renderTableCell(data.Cash, "40%", "right"),
            ]),
            React.createElement(View, { style: globalStyles.tableRow }, [
              renderTableCell("CMP", "60%", "left", true),
              renderTableCell(data.CMP, "40%", "right"),
            ]),
            React.createElement(View, { style: globalStyles.tableRow }, [
              renderTableCell("Target Price", "60%", "left", true),
              renderTableCell(data["Target Price"], "40%", "right"),
            ]),
          ]),
        ]),

        // 4. Guidance & Risks (Full Width Bottom Box)
        React.createElement(View, { style: styles.fullGridBox }, [
          React.createElement(Text, { style: globalStyles.sectionTitle }, "Forward Guidance & Outlook Summary"),
          React.createElement(View, { style: { backgroundColor: COLORS.cardBg, padding: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 2 } }, [
            React.createElement(Text, { style: { fontSize: 8.5, color: COLORS.darkText, lineHeight: 1.4 } }, data.Guidance || "No explicit forward guidance provided in the financial source document."),
          ]),
        ]),
      ]),

      // Page Footer
      renderFooter(3),
    ]
  );
}
