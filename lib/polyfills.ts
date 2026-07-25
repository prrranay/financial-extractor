/**
 * Serverless / Node.js polyfills for libraries requiring DOM globals (like pdfjs-dist)
 */

const g = (typeof global !== "undefined" ? global : globalThis) as unknown as Record<string, unknown>;

if (!g.DOMMatrix) {
  g.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor() {}
    toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
  };
}

if (!g.ImageData) {
  g.ImageData = class ImageData {
    width = 0; height = 0; data = new Uint8ClampedArray(0);
    constructor() {}
  };
}

if (!g.Path2D) {
  g.Path2D = class Path2D {
    constructor() {}
  };
}
