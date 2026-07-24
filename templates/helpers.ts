import React from "react";
import { StyleSheet, View, Text, Image } from "@react-pdf/renderer";

// Geojit Color Palette & Premium Report Palette
export const COLORS = {
  primary: "#007b85",      // Geojit Green/Teal
  secondary: "#0d3c4c",    // Dark Slate
  darkText: "#1f2937",     // gray-800
  lightText: "#4b5563",    // gray-600
  mutedText: "#9ca3af",    // gray-400
  border: "#e5e7eb",       // gray-200
  cardBg: "#f9fafb",       // gray-50
  tableHeaderBg: "#f3f4f6", // gray-100
  accentUp: "#059669",     // Emerald (Positive return / Upgrade)
  accentDown: "#dc2626",   // Rose (Negative return / Downgrade)
  badgeBg: "#e5e7eb",      // gray-200 for Hold/Rating badges
};

export const globalStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: COLORS.darkText,
    lineHeight: 1.3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingBottom: 8,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerTitle: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  recommendationBadge: {
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 2,
    fontWeight: "bold",
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 7,
    color: COLORS.mutedText,
  },
  footerLogo: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 3,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    color: COLORS.primary,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    color: COLORS.lightText,
    fontSize: 8,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: "center",
    minHeight: 16,
  },
  tableHeader: {
    backgroundColor: COLORS.tableHeaderBg,
    fontWeight: "bold",
  },
  tableCell: {
    padding: 3,
    fontSize: 7,
  },
});

// Helper for rendering bullet points
export function renderBulletPoint(text: string) {
  return React.createElement(
    View,
    { style: globalStyles.bulletItem, key: text.substring(0, 15) },
    [
      React.createElement(Text, { style: globalStyles.bulletDot }, "•"),
      React.createElement(Text, { style: globalStyles.bulletText }, text),
    ]
  );
}

// Helper for footer rendering
export function renderFooter(pageNumber: number) {
  return React.createElement(
    View,
    { style: globalStyles.footer, fixed: true },
    [
      React.createElement(Text, { style: globalStyles.footerLogo }, "www.geojit.com"),
      React.createElement(Text, {}, `Page ${pageNumber}`),
    ]
  );
}

// Helper for key-value table cell rendering
export function renderTableCell(
  text: string | number,
  width: string | number,
  align: "left" | "center" | "right" = "left",
  isBold = false
) {
  return React.createElement(
    Text,
    {
      style: [
        globalStyles.tableCell,
        {
          width: width,
          textAlign: align,
          fontWeight: isBold ? "bold" : "normal",
        },
      ],
    },
    String(text)
  );
}
