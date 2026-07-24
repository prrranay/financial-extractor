import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { ReportData } from "../types";
import { COLORS, globalStyles, renderBulletPoint, renderFooter, renderTableCell } from "./helpers";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flex: 1,
    marginTop: 10,
    marginBottom: 20,
  },
  leftCol: {
    width: "35%",
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  rightCol: {
    width: "65%",
    paddingLeft: 10,
  },
  metaBar: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 6,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  metaBox: {
    flexDirection: "column",
    alignItems: "center",
    width: "18%",
  },
  metaLabel: {
    fontSize: 7,
    color: COLORS.lightText,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.secondary,
  },
  tableHeaderItem: {
    fontSize: 7,
    fontWeight: "bold",
    color: COLORS.secondary,
    paddingVertical: 3,
  },
});

export function renderPage1(data: ReportData) {
  // Calculate expected return if target and cmp are numbers
  let expectedReturn = "N/A";
  const cmpNum = parseFloat(data.CMP.replace(/[^0-9.]/g, ""));
  const targetNum = parseFloat(data["Target Price"].replace(/[^0-9.]/g, ""));
  if (!isNaN(cmpNum) && !isNaN(targetNum) && cmpNum > 0) {
    const ret = ((targetNum - cmpNum) / cmpNum) * 100;
    expectedReturn = `${ret >= 0 ? "+" : ""}${ret.toFixed(0)}%`;
  }

  // Determine recommendation based on return
  let recommendation = "HOLD";
  if (expectedReturn !== "N/A") {
    const retVal = parseFloat(expectedReturn);
    if (retVal > 15) recommendation = "BUY";
    else if (retVal < 0) recommendation = "SELL";
  }

  // Left Column Content: Company Data, Shareholding & Ratios
  const companyDataRows = [
    { label: "Market Cap", value: data["Market Cap"] },
    { label: "Revenue", value: data.Revenue },
    { label: "EBITDA", value: data.EBITDA },
    { label: "PAT", value: data.PAT },
    { label: "Margins", value: data.Margins },
    { label: "EPS", value: data.EPS },
    { label: "ROE", value: data.ROE },
    { label: "Debt", value: data.Debt },
    { label: "Cash", value: data.Cash },
  ];

  const leftColumnElement = React.createElement(View, { style: styles.leftCol }, [
    // Company Data Table
    React.createElement(Text, { style: globalStyles.sectionTitle }, "Company Metrics"),
    React.createElement(View, { style: globalStyles.table }, [
      ...companyDataRows.map((row) =>
        React.createElement(View, { style: globalStyles.tableRow, key: row.label }, [
          renderTableCell(row.label, "60%", "left", true),
          renderTableCell(row.value, "40%", "right"),
        ])
      ),
    ]),

    // Shareholding Table
    React.createElement(Text, { style: globalStyles.sectionTitle }, "Shareholding (%)"),
    React.createElement(View, { style: globalStyles.table }, [
      React.createElement(View, { style: [globalStyles.tableRow, globalStyles.tableHeader] }, [
        renderTableCell("Category", "60%", "left", true),
        renderTableCell("Value", "40%", "right", true),
      ]),
      ...Object.entries(data.Shareholding || {}).map(([key, val]) =>
        React.createElement(View, { style: globalStyles.tableRow, key }, [
          renderTableCell(key, "60%", "left"),
          renderTableCell(String(val), "40%", "right"),
        ])
      ),
    ]),

    // General Valuation Ratios Table
    React.createElement(Text, { style: globalStyles.sectionTitle }, "Key Valuation Ratios"),
    React.createElement(View, { style: globalStyles.table }, [
      React.createElement(View, { style: [globalStyles.tableRow, globalStyles.tableHeader] }, [
        renderTableCell("Ratio", "60%", "left", true),
        renderTableCell("Value", "40%", "right", true),
      ]),
      ...Object.entries(data.Ratios || {}).map(([key, val]) =>
        React.createElement(View, { style: globalStyles.tableRow, key }, [
          renderTableCell(key, "60%", "left"),
          renderTableCell(String(val), "40%", "right"),
        ])
      ),
    ]),
  ]);

  // Right Column Content: Summary, Bullets, Outlook, and Quarterly Table
  const rightColumnElement = React.createElement(View, { style: styles.rightCol }, [
    React.createElement(Text, { style: globalStyles.sectionTitle }, `${data.Company} Analysis`),
    React.createElement(Text, { style: { fontSize: 9, color: COLORS.darkText, marginBottom: 8, fontWeight: "bold" } }, data["Investment Summary"]),

    // Key Highlights Bullet list
    React.createElement(Text, { style: { fontSize: 8.5, fontWeight: "bold", color: COLORS.secondary, marginBottom: 4 } }, "Investment Highlights"),
    React.createElement(
      View,
      { style: { marginBottom: 12 } },
      (data["Key Highlights"] || []).slice(0, 4).map((bullet) => renderBulletPoint(bullet))
    ),

    // Outlook
    React.createElement(Text, { style: globalStyles.sectionTitle }, "Outlook & Valuation"),
    React.createElement(Text, { style: { fontSize: 8, color: COLORS.lightText, marginBottom: 12, textAlign: "justify" } }, data.Outlook),

    // Quarterly Consolidated Table
    React.createElement(Text, { style: globalStyles.sectionTitle }, "Quarterly Financials Consolidated"),
    React.createElement(View, { style: globalStyles.table }, [
      // Headers
      React.createElement(View, { style: [globalStyles.tableRow, globalStyles.tableHeader] }, [
        renderTableCell("Metrics", "30%", "left", true),
        ...(data["Quarterly Financial Table"] && data["Quarterly Financial Table"][0]
          ? Object.keys(data["Quarterly Financial Table"][0])
              .filter((k) => k !== "Metric" && k !== "metrics")
              .map((header) => renderTableCell(header, "17.5%", "right", true))
          : []),
      ]),
      // Rows
      ...(data["Quarterly Financial Table"] || []).map((row, rIdx) => {
        const keys = Object.keys(row);
        const metricKey = keys.find((k) => k.toLowerCase() === "metric" || k.toLowerCase() === "metrics") || keys[0];
        const valKeys = keys.filter((k) => k !== metricKey);
        
        return React.createElement(View, { style: globalStyles.tableRow, key: rIdx }, [
          renderTableCell(String(row[metricKey]), "30%", "left", true),
          ...valKeys.map((key) => renderTableCell(String(row[key]), "17.5%", "right")),
        ]);
      }),
    ]),
  ]);

  // Combined Page Layout
  return React.createElement(
    Page,
    { size: "A4", style: globalStyles.page, key: "page1" },
    [
      // Geojit Style Top Header
      React.createElement(View, { style: globalStyles.header }, [
        React.createElement(View, { style: globalStyles.headerLeft }, [
          React.createElement(Text, { style: globalStyles.headerTitle }, "Retail Equity Research"),
          React.createElement(Text, { style: globalStyles.companyName }, data.Company),
          React.createElement(Text, { style: { fontSize: 8, color: COLORS.lightText, marginTop: 2 } }, `Sector: ${data.Sector}`),
        ]),
        React.createElement(View, { style: globalStyles.headerRight }, [
          React.createElement(Text, { style: globalStyles.recommendationBadge }, recommendation),
          React.createElement(Text, { style: { fontSize: 8, color: COLORS.lightText, marginTop: 4 } }, new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })),
        ]),
      ]),

      // Key Changes / Targets Bar
      React.createElement(View, { style: styles.metaBar }, [
        React.createElement(View, { style: styles.metaBox }, [
          React.createElement(Text, { style: styles.metaLabel }, "CMP"),
          React.createElement(Text, { style: styles.metaValue }, data.CMP),
        ]),
        React.createElement(View, { style: styles.metaBox }, [
          React.createElement(Text, { style: styles.metaLabel }, "Target Price"),
          React.createElement(Text, { style: styles.metaValue }, data["Target Price"]),
        ]),
        React.createElement(View, { style: styles.metaBox }, [
          React.createElement(Text, { style: styles.metaLabel }, "Expected Return"),
          React.createElement(Text, { style: [styles.metaValue, { color: COLORS.accentUp }] }, expectedReturn),
        ]),
        React.createElement(View, { style: styles.metaBox }, [
          React.createElement(Text, { style: styles.metaLabel }, "Sector"),
          React.createElement(Text, { style: [styles.metaValue, { fontSize: 7 }] }, data.Sector),
        ]),
        React.createElement(View, { style: styles.metaBox }, [
          React.createElement(Text, { style: styles.metaLabel }, "Valuation basis"),
          React.createElement(Text, { style: [styles.metaValue, { fontSize: 7 }] }, "LLM Extract"),
        ]),
      ]),

      // Columns Grid
      React.createElement(View, { style: styles.container }, [
        leftColumnElement,
        rightColumnElement,
      ]),

      // Page Footer
      renderFooter(1),
    ]
  );
}
