import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { ReportData } from "../types";
import { COLORS, globalStyles, renderFooter, renderTableCell } from "./helpers";

const styles = StyleSheet.create({
  titleContainer: {
    backgroundColor: COLORS.secondary,
    padding: 6,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  ratingCriteriaTable: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  disclaimerBox: {
    padding: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    borderRadius: 2,
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 6,
    color: COLORS.lightText,
    textAlign: "justify",
    marginBottom: 4,
    lineHeight: 1.3,
  },
  disclaimerHeader: {
    fontSize: 7,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  warningText: {
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.accentDown,
    textAlign: "center",
    marginVertical: 6,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.accentDown,
    borderRadius: 2,
  },
  contactGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.5,
    color: COLORS.lightText,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
  contactCol: {
    width: "48%",
  },
});

export function renderPage4(data: ReportData) {
  // Determine expected return & recommendation
  let expectedReturn = "N/A";
  const cmpNum = parseFloat(data.CMP.replace(/[^0-9.]/g, ""));
  const targetNum = parseFloat(data["Target Price"].replace(/[^0-9.]/g, ""));
  if (!isNaN(cmpNum) && !isNaN(targetNum) && cmpNum > 0) {
    const ret = ((targetNum - cmpNum) / cmpNum) * 100;
    expectedReturn = `${ret >= 0 ? "+" : ""}${ret.toFixed(0)}%`;
  }

  let recommendation = "HOLD";
  if (expectedReturn !== "N/A") {
    const retVal = parseFloat(expectedReturn);
    if (retVal > 15) recommendation = "BUY";
    else if (retVal < 0) recommendation = "SELL";
  }

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return React.createElement(
    Page,
    { size: "A4", style: globalStyles.page, key: "page4" },
    [
      // Geojit Style Top Header
      React.createElement(View, { style: globalStyles.header }, [
        React.createElement(View, { style: globalStyles.headerLeft }, [
          React.createElement(Text, { style: globalStyles.headerTitle }, "Retail Equity Research"),
          React.createElement(Text, { style: globalStyles.companyName }, data.Company),
        ]),
        React.createElement(Text, { style: { fontSize: 8, color: COLORS.lightText } }, "Recommendation History & Disclosures"),
      ]),

      // Recommendation Summary Table
      React.createElement(View, { style: styles.titleContainer }, [
        React.createElement(Text, {}, "Recommendation Summary - History"),
      ]),
      React.createElement(View, { style: globalStyles.table }, [
        React.createElement(View, { style: [globalStyles.tableRow, globalStyles.tableHeader] }, [
          renderTableCell("Date", "33%", "left", true),
          renderTableCell("Rating", "33%", "center", true),
          renderTableCell("Target Price (Rs.)", "34%", "right", true),
        ]),
        // Mock a couple historical rows leading to the current active recommendation
        React.createElement(View, { style: globalStyles.tableRow }, [
          renderTableCell("12-Jan-2025", "33%", "left"),
          renderTableCell("ACCUMULATE", "33%", "center"),
          renderTableCell(String(targetNum ? Math.round(targetNum * 0.9) : "300"), "34%", "right"),
        ]),
        React.createElement(View, { style: globalStyles.tableRow }, [
          renderTableCell(currentDateStr, "33%", "left", true),
          renderTableCell(recommendation, "33%", "center", true),
          renderTableCell(data["Target Price"], "34%", "right", true),
        ]),
      ]),

      // Investment Rating Criteria
      React.createElement(View, { style: styles.titleContainer }, [
        React.createElement(Text, {}, "Investment Rating Criteria"),
      ]),
      React.createElement(View, { style: globalStyles.table }, [
        React.createElement(View, { style: [globalStyles.tableRow, globalStyles.tableHeader] }, [
          renderTableCell("Ratings", "25%", "left", true),
          renderTableCell("Large Caps", "25%", "left", true),
          renderTableCell("Mid Caps", "25%", "left", true),
          renderTableCell("Small Caps", "25%", "left", true),
        ]),
        React.createElement(View, { style: globalStyles.tableRow }, [
          renderTableCell("Buy", "25%", "left", true),
          renderTableCell("Upside is above 10%", "25%", "left"),
          renderTableCell("Upside is above 15%", "25%", "left"),
          renderTableCell("Upside is above 20%", "25%", "left"),
        ]),
        React.createElement(View, { style: globalStyles.tableRow }, [
          renderTableCell("Accumulate", "25%", "left", true),
          renderTableCell("Upside between 0% - 10%", "25%", "left"),
          renderTableCell("Upside between 10% - 15%", "25%", "left"),
          renderTableCell("Upside between 10% - 20%", "25%", "left"),
        ]),
        React.createElement(View, { style: globalStyles.tableRow }, [
          renderTableCell("Hold", "25%", "left", true),
          renderTableCell("Downside between 0% - 5%", "25%", "left"),
          renderTableCell("Upside between 0% - 10%", "25%", "left"),
          renderTableCell("Upside between 0% - 10%", "25%", "left"),
        ]),
        React.createElement(View, { style: globalStyles.tableRow }, [
          renderTableCell("Reduce/Sell", "25%", "left", true),
          renderTableCell("Downside is more than 5%", "25%", "left"),
          renderTableCell("Downside is more than 0%", "25%", "left"),
          renderTableCell("Downside is more than 0%", "25%", "left"),
        ]),
      ]),

      // Legal Disclaimers & Disclosures
      React.createElement(Text, { style: globalStyles.sectionTitle }, "Disclaimer & Disclosures"),
      React.createElement(View, { style: styles.disclaimerBox }, [
        React.createElement(Text, { style: styles.disclaimerHeader }, "Analyst Certification"),
        React.createElement(Text, { style: styles.disclaimerText }, 
          "The analyst(s) certifying this report hereby declare that all views stated in this document accurately reflect personal opinions regarding the subject securities or issuers. No part of analyst compensation was, is, or will be directly or indirectly related to the specific recommendations or opinions expressed in this research report."
        ),
        React.createElement(Text, { style: styles.disclaimerHeader }, "General Disclaimer"),
        React.createElement(Text, { style: styles.disclaimerText }, 
          "This report has been compiled for informational purposes only and does not constitute investment advice, an offer to buy or sell, or a solicitation of an offer to buy or sell any security. All information, opinions, and forecasts contained herein are subject to change without notice. While data is obtained from sources believed to be reliable, its completeness or accuracy is not guaranteed. GIL or any of its affiliates do not accept any liability arising from the use of this report."
        ),
        React.createElement(Text, { style: styles.disclaimerHeader }, "Disclosure regarding Financial Interest"),
        React.createElement(Text, { style: styles.disclaimerText }, 
          "GIL and its research analysts confirm that they do not hold any actual or beneficial ownership of 1% or more of the subject company's securities, nor do they have any material conflict of interest at the time of publication of this report. No associate or analyst has received compensation or fees from the subject company in the past twelve months for investment banking, brokerage, or advisory services."
        ),
      ]),

      // Standard SEBI Warning
      React.createElement(Text, { style: styles.warningText }, 
        "Standard Warning: \"Investment in securities market are subject to market risks. Read all the related documents carefully before investing.\""
      ),

      // Contact & Offices Footer Grid
      React.createElement(View, { style: styles.contactGrid }, [
        React.createElement(View, { style: styles.contactCol }, [
          React.createElement(Text, { style: { fontWeight: "bold", marginBottom: 2 } }, "Geojit Financial Services Ltd."),
          React.createElement(Text, {}, "Registered Office: 7th Floor, 34/659-P, Civil Line Road, Padivattom, Kochi-682024, Kerala."),
          React.createElement(Text, {}, "Phone: +91 484-2901000 | Email: customercare@geojit.com"),
          React.createElement(Text, {}, "SEBI Research Entity Reg No: INH000019567"),
        ]),
        React.createElement(View, { style: [styles.contactCol, { alignItems: "flex-end", textAlign: "right" }] }, [
          React.createElement(Text, { style: { fontWeight: "bold", marginBottom: 2 } }, "Grievance Redressal Officer"),
          React.createElement(Text, {}, "Compliance Officer: Ms. Indu K. | Address: 7th Floor, Kochi-682024."),
          React.createElement(Text, {}, "Phone: +91 484-2901367 | Email: compliance@geojit.com"),
          React.createElement(Text, {}, "Corporate Identity Number: U66110KL2023PLC080586"),
        ]),
      ]),

      // Page Footer
      renderFooter(4),
    ]
  );
}
