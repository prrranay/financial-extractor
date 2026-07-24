import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";

const width = 240;
const height = 110;

// Setup ChartJSNodeCanvas instance
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height
});

/**
 * Clean and parse numeric values from unstructured strings (e.g. "1,200.50", "15%").
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
 * Checks if a series contains valid, renderable non-zero data.
 */
function hasValidData(data: number[]): boolean {
  return data.length > 0 && data.some((v) => v !== 0 && !isNaN(v));
}

export interface GeneratedCharts {
  revenue?: Buffer;
  ebitda?: Buffer;
  pat?: Buffer;
  margins?: Buffer;
}

/**
 * Generates PNG buffers for Revenue, EBITDA, PAT, and Margin trend charts from yearly financial tables.
 * Returns undefined for any metrics that are missing or consist entirely of zeroes.
 * 
 * @param yearlyTable - The array of yearly financial records.
 * @returns A promise resolving to the generated chart buffers.
 */
export async function generateFinancialCharts(
  yearlyTable: Array<Record<string, string | number>>
): Promise<GeneratedCharts> {
  if (!yearlyTable || yearlyTable.length === 0) {
    return {};
  }

  const labels: string[] = [];
  const revenueData: number[] = [];
  const ebitdaData: number[] = [];
  const patData: number[] = [];
  const marginsData: number[] = [];

  yearlyTable.forEach((row) => {
    // Find key representing Year
    const yearKey = Object.keys(row).find(
      (k) => k.toLowerCase() === "year" || k.toLowerCase() === "y.e march" || k.toLowerCase().includes("period")
    ) || "Year";
    const year = row[yearKey] ? String(row[yearKey]) : "";
    labels.push(year);

    // Find keys representing metrics
    const revKey = Object.keys(row).find((k) => k.toLowerCase() === "revenue" || k.toLowerCase() === "sales") || "Revenue";
    const ebtKey = Object.keys(row).find((k) => k.toLowerCase() === "ebitda") || "EBITDA";
    const patKey = Object.keys(row).find((k) => k.toLowerCase() === "pat" || k.toLowerCase() === "pat adjusted" || k.toLowerCase() === "net profit") || "PAT";
    const marginKey = Object.keys(row).find((k) => k.toLowerCase().includes("margin") || k.toLowerCase() === "margins") || "Margins";

    revenueData.push(parseNumericValue(row[revKey]));
    ebitdaData.push(parseNumericValue(row[ebtKey]));
    patData.push(parseNumericValue(row[patKey]));
    marginsData.push(parseNumericValue(row[marginKey]));
  });

  // Base helper to build a clean chart configuration
  const createConfig = (
    title: string,
    data: number[],
    color: string,
    type: "bar" | "line"
  ): ChartConfiguration => {
    return {
      type,
      data: {
        labels,
        datasets: [
          {
            label: title,
            data,
            backgroundColor: type === "bar" ? color : "transparent",
            borderColor: color.replace("0.7", "1.0"),
            borderWidth: type === "line" ? 2 : 1,
            borderRadius: type === "bar" ? 3 : 0,
            pointBackgroundColor: color.replace("0.7", "1.0"),
            pointRadius: type === "line" ? 2.5 : 0,
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
              size: 9,
              weight: "bold",
              family: "Helvetica"
            },
            color: "#1e293b",
            padding: {
              bottom: 6,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "#f1f5f9",
            },
            ticks: {
              color: "#64748b",
              font: {
                size: 7,
                family: "Helvetica"
              }
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#64748b",
              font: {
                size: 7,
                family: "Helvetica"
              }
            },
          },
        },
      },
    };
  };

  const result: GeneratedCharts = {};

  if (hasValidData(revenueData)) {
    try {
      result.revenue = await chartJSNodeCanvas.renderToBuffer(
        createConfig("Revenue Trend", revenueData, "rgba(30, 58, 138, 0.7)", "bar") // Navy blue
      );
    } catch (e) {
      console.error("Failed to render Revenue Trend chart:", e);
    }
  }
  
  if (hasValidData(ebitdaData)) {
    try {
      result.ebitda = await chartJSNodeCanvas.renderToBuffer(
        createConfig("EBITDA Trend", ebitdaData, "rgba(79, 70, 229, 0.7)", "bar") // Indigo
      );
    } catch (e) {
      console.error("Failed to render EBITDA Trend chart:", e);
    }
  }
  
  if (hasValidData(patData)) {
    try {
      result.pat = await chartJSNodeCanvas.renderToBuffer(
        createConfig("PAT Trend", patData, "rgba(13, 148, 136, 0.7)", "bar") // Teal
      );
    } catch (e) {
      console.error("Failed to render PAT Trend chart:", e);
    }
  }

  if (hasValidData(marginsData)) {
    try {
      result.margins = await chartJSNodeCanvas.renderToBuffer(
        createConfig("Margin (%) Trend", marginsData, "rgba(217, 119, 6, 0.7)", "line") // Amber
      );
    } catch (e) {
      console.error("Failed to render Margins Trend chart:", e);
    }
  }

  return result;
}
