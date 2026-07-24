import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["chartjs-node-canvas", "canvas", "pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
