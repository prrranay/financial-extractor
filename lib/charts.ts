import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";

const width = 500;
const height = 300;

// Setup ChartJSNodeCanvas instance
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height
});

/**
 * Clean and parse numeric values from unstructured strings (e.g. "1,200.50", "$340M", "10%").
 */
function parseNumericValue(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val !== "string") return 0;
  
  // Remove currency symbols, commas, percent signs, and spaces
  const cleaned = val.replace(/[$,%\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Generates PNG buffers for Revenue, EBITDA, and PAT trends from a yearly financial table.
 * Designed with a clean, high-contrast style suitable for equity research reports.
 * 
 * @param yearlyTable - The array of yearly financial records.
 * @returns A promise resolving to an object containing the three chart buffers.
 */
export async function generateFinancialCharts(
  yearlyTable: Array<Record<string, string | number>>
): Promise<{ revenue: Buffer; ebitda: Buffer; pat: Buffer }> {
  const labels: string[] = [];
  const revenueData: number[] = [];
  const ebitdaData: number[] = [];
  const patData: number[] = [];

  yearlyTable.forEach((row) => {
    // Find key representing Year
    const yearKey = Object.keys(row).find((k) => k.toLowerCase() === "year") || "Year";
    const year = row[yearKey] ? String(row[yearKey]) : "";
    labels.push(year);

    // Find keys representing metrics
    const revKey = Object.keys(row).find((k) => k.toLowerCase() === "revenue") || "Revenue";
    const ebtKey = Object.keys(row).find((k) => k.toLowerCase() === "ebitda") || "EBITDA";
    const patKey = Object.keys(row).find((k) => k.toLowerCase() === "pat") || "PAT";

    revenueData.push(parseNumericValue(row[revKey]));
    ebitdaData.push(parseNumericValue(row[ebtKey]));
    patData.push(parseNumericValue(row[patKey]));
  });

  // Base helper to build a clean chart configuration
  const createConfig = (
    title: string,
    data: number[],
    color: string
  ): ChartConfiguration => {
    return {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: title,
            data,
            backgroundColor: color,
            borderColor: color.replace("0.7", "1.0"),
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.5,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 16,
              weight: "bold",
              family: "Helvetica, Arial, sans-serif"
            },
            color: "#111827", // gray-900
            padding: {
              bottom: 15,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "#e5e7eb", // gray-200
            },
            ticks: {
              color: "#4b5563", // gray-600
              font: {
                size: 11,
                family: "Helvetica, Arial, sans-serif"
              }
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#4b5563", // gray-600
              font: {
                size: 11,
                family: "Helvetica, Arial, sans-serif"
              }
            },
          },
        },
      },
    };
  };

  // Render all three charts to buffers
  const revenue = await chartJSNodeCanvas.renderToBuffer(
    createConfig("Revenue Trend", revenueData, "rgba(30, 58, 138, 0.7)") // Navy blue
  );
  
  const ebitda = await chartJSNodeCanvas.renderToBuffer(
    createConfig("EBITDA Trend", ebitdaData, "rgba(79, 70, 229, 0.7)") // Indigo
  );
  
  const pat = await chartJSNodeCanvas.renderToBuffer(
    createConfig("PAT Trend", patData, "rgba(13, 148, 136, 0.7)") // Teal
  );

  return { revenue, ebitda, pat };
}
