import React from "react";
import { Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { ReportData } from "../types";
import { COLORS, globalStyles, renderBulletPoint, renderFooter, renderTableCell } from "./helpers";

const styles = StyleSheet.create({
  highlightsHeader: {
    backgroundColor: COLORS.secondary,
    padding: 8,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  highlightsContainer: {
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  chartsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  chartWrapper: {
    width: "48%",
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 5,
    marginBottom: 10,
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 3,
  },
  chartImage: {
    width: "100%",
    height: 120,
  },
  chartTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: 4,
    textAlign: "center",
  },
});

export interface Page2Charts {
  revenue?: string | Buffer;
  ebitda?: string | Buffer;
  pat?: string | Buffer;
}

export function renderPage2(data: ReportData, charts?: Page2Charts) {
  // Key highlights list
  const highlights = data["Key Highlights"] && data["Key Highlights"].length > 0 
    ? data["Key Highlights"]
    : data["Raw Highlights"] && data["Raw Highlights"].length > 0
    ? data["Raw Highlights"]
    : ["No highlights extracted from document."];

  return React.createElement(
    Page,
    { size: "A4", style: globalStyles.page, key: "page2" },
    [
      // Geojit Style Top Header
      React.createElement(View, { style: globalStyles.header }, [
        React.createElement(View, { style: globalStyles.headerLeft }, [
          React.createElement(Text, { style: globalStyles.headerTitle }, "Retail Equity Research"),
          React.createElement(Text, { style: globalStyles.companyName }, data.Company),
        ]),
        React.createElement(Text, { style: { fontSize: 8, color: COLORS.lightText } }, "Key Highlights & Financial Trends"),
      ]),

      // Key Highlights Header Bar
      React.createElement(View, { style: styles.highlightsHeader }, [
        React.createElement(Text, {}, "Key Highlights"),
      ]),

      // Key Highlights bullet list (up to 4 bullets for layout sizing)
      React.createElement(
        View,
        { style: styles.highlightsContainer },
        highlights.slice(0, 4).map((bullet) => renderBulletPoint(bullet))
      ),

      // Charts Section
      React.createElement(Text, { style: globalStyles.sectionTitle }, "Financial Performance Trends"),
      React.createElement(View, { style: styles.chartsGrid }, [
        // Revenue Chart
        charts?.revenue
          ? React.createElement(View, { style: styles.chartWrapper, key: "rev-chart" }, [
              React.createElement(Text, { style: styles.chartTitle }, "Revenue Growth"),
              React.createElement(Image, { style: styles.chartImage, src: charts.revenue }),
            ])
          : null,
        // EBITDA Chart
        charts?.ebitda
          ? React.createElement(View, { style: styles.chartWrapper, key: "eb-chart" }, [
              React.createElement(Text, { style: styles.chartTitle }, "EBITDA margin Trend"),
              React.createElement(Image, { style: styles.chartImage, src: charts.ebitda }),
            ])
          : null,
        // PAT Chart
        charts?.pat
          ? React.createElement(View, { style: [styles.chartWrapper, { width: "100%", alignItems: "center" }], key: "pat-chart" }, [
              React.createElement(Text, { style: styles.chartTitle }, "Profit After Tax (PAT) Trend"),
              React.createElement(Image, { style: [styles.chartImage, { width: "50%", height: 110 }], src: charts.pat }),
            ])
          : null,
      ]),

      // Yearly Financial Projections table (representing change in estimates / estimates tracker)
      React.createElement(Text, { style: globalStyles.sectionTitle }, "Yearly Projections & Estimates"),
      React.createElement(View, { style: globalStyles.table }, [
        // Headers
        React.createElement(View, { style: [globalStyles.tableRow, globalStyles.tableHeader] }, [
          renderTableCell("Metric", "30%", "left", true),
          ...(data["Yearly Financial Table"] && data["Yearly Financial Table"][0]
            ? Object.keys(data["Yearly Financial Table"][0])
                .filter((k) => k !== "Metric" && k !== "metrics")
                .map((header) => renderTableCell(header, "17.5%", "right", true))
            : []),
        ]),
        // Rows
        ...(data["Yearly Financial Table"] || []).map((row, rIdx) => {
          const keys = Object.keys(row);
          const metricKey = keys.find((k) => k.toLowerCase() === "metric" || k.toLowerCase() === "metrics") || keys[0];
          const valKeys = keys.filter((k) => k !== metricKey);
          
          return React.createElement(View, { style: globalStyles.tableRow, key: rIdx }, [
            renderTableCell(String(row[metricKey]), "30%", "left", true),
            ...valKeys.map((key) => renderTableCell(String(row[key]), "17.5%", "right")),
          ]);
        }),
      ]),

      // Page Footer
      renderFooter(2),
    ]
  );
}
