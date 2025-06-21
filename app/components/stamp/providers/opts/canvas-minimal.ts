import { HashArtProvider, HashArtRenderParams } from "../types";

export class CanvasMinimalProvider implements HashArtProvider {
  id = "canvas-minimal";
  name = "Canvas Minimal";
  description = "Clean, minimal geometric art using Canvas 2D API";

  private canvas: HTMLCanvasElement | null = null;

  async render(params: HashArtRenderParams): Promise<void> {
    const { hash, leadingZeros, width, height, container } = params;

    // 清理现有的canvas
    this.cleanup();

    // 创建canvas元素
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.style.display = "block";
    this.canvas.style.margin = "0 auto";

    container.appendChild(this.canvas);

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }

    // 生成当前使用的hash
    const currentHash = hash || this.generateSimulatedHash(leadingZeros);
    const currentLeadingZeros = hash
      ? this.countLeadingZeros(hash)
      : leadingZeros;

    this.drawArt(ctx, currentHash, currentLeadingZeros, width, height);
  }

  cleanup(): void {
    // 简单清理引用，不操作DOM
    this.canvas = null;
  }

  private countLeadingZeros(hashStr: string): number {
    let count = 0;
    for (let i = 0; i < hashStr.length; i++) {
      if (hashStr[i] === "0") {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  private generateSimulatedHash(
    numLeadingZeros: number,
    totalHashLength = 64
  ): string {
    let hashStr = "0".repeat(Math.min(numLeadingZeros, totalHashLength));
    const remainingLength = totalHashLength - hashStr.length;
    const characters = "0123456789abcdef";
    for (let i = 0; i < remainingLength; i++) {
      hashStr += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return hashStr;
  }

  private drawArt(
    ctx: CanvasRenderingContext2D,
    hashStr: string,
    zeros: number,
    width: number,
    height: number
  ): void {
    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // Convert hash to integer array for deterministic randomness
    const hashInts: number[] = [];
    for (let i = 0; i < hashStr.length; i += 2) {
      hashInts.push(parseInt(hashStr.substring(i, i + 2), 16));
    }

    let hashValueIndex = 0;
    const getHashValue = (maxVal = 255): number => {
      const value = hashInts[hashValueIndex % hashInts.length] % (maxVal + 1);
      hashValueIndex++;
      return value;
    };

    // 基础颜色
    const baseHue = getHashValue(360);
    const saturation = Math.min(30 + zeros * 10, 80);
    const lightness = Math.min(40 + zeros * 8, 80);

    // 设置画布背景
    const bgColor = this.hslToRgb(baseHue, saturation * 0.3, 95);
    ctx.fillStyle = `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;
    ctx.fillRect(0, 0, width, height);

    // 根据难度级别绘制不同的图案
    if (zeros === 0) {
      this.drawDots(
        ctx,
        getHashValue,
        baseHue,
        saturation,
        lightness,
        width,
        height
      );
    } else if (zeros <= 2) {
      this.drawLines(
        ctx,
        getHashValue,
        baseHue,
        saturation,
        lightness,
        width,
        height
      );
    } else if (zeros <= 4) {
      this.drawRectangles(
        ctx,
        getHashValue,
        baseHue,
        saturation,
        lightness,
        width,
        height
      );
    } else if (zeros <= 6) {
      this.drawCircles(
        ctx,
        getHashValue,
        baseHue,
        saturation,
        lightness,
        width,
        height
      );
    } else {
      this.drawComplex(
        ctx,
        getHashValue,
        baseHue,
        saturation,
        lightness,
        width,
        height
      );
    }
  }

  private drawDots(
    ctx: CanvasRenderingContext2D,
    getHashValue: Function,
    baseHue: number,
    saturation: number,
    lightness: number,
    width: number,
    height: number
  ): void {
    const numDots = 5 + getHashValue(8);

    for (let i = 0; i < numDots; i++) {
      const x = getHashValue(width);
      const y = getHashValue(height);
      const radius = 2 + getHashValue(6);

      const color = this.hslToRgb(
        (baseHue + getHashValue(60)) % 360,
        saturation,
        lightness
      );

      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLines(
    ctx: CanvasRenderingContext2D,
    getHashValue: Function,
    baseHue: number,
    saturation: number,
    lightness: number,
    width: number,
    height: number
  ): void {
    const numLines = 3 + getHashValue(5);

    ctx.lineWidth = 1 + getHashValue(3);
    ctx.lineCap = "round";

    for (let i = 0; i < numLines; i++) {
      const color = this.hslToRgb(
        (baseHue + getHashValue(120)) % 360,
        saturation,
        lightness
      );

      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
      ctx.beginPath();
      ctx.moveTo(getHashValue(width), getHashValue(height));
      ctx.lineTo(getHashValue(width), getHashValue(height));
      ctx.stroke();
    }
  }

  private drawRectangles(
    ctx: CanvasRenderingContext2D,
    getHashValue: Function,
    baseHue: number,
    saturation: number,
    lightness: number,
    width: number,
    height: number
  ): void {
    const numRects = 2 + getHashValue(4);

    for (let i = 0; i < numRects; i++) {
      const x = getHashValue(width * 0.8);
      const y = getHashValue(height * 0.8);
      const w = 10 + getHashValue(width * 0.3);
      const h = 10 + getHashValue(height * 0.3);

      const color = this.hslToRgb(
        (baseHue + getHashValue(180)) % 360,
        saturation,
        lightness
      );

      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
      ctx.fillRect(x, y, w, h);
    }
  }

  private drawCircles(
    ctx: CanvasRenderingContext2D,
    getHashValue: Function,
    baseHue: number,
    saturation: number,
    lightness: number,
    width: number,
    height: number
  ): void {
    const numCircles = 3 + getHashValue(4);

    for (let i = 0; i < numCircles; i++) {
      const x = getHashValue(width);
      const y = getHashValue(height);
      const radius = 5 + getHashValue(Math.min(width, height) * 0.2);

      const color = this.hslToRgb(
        (baseHue + getHashValue(240)) % 360,
        saturation,
        lightness
      );

      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
      ctx.lineWidth = 1 + getHashValue(3);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawComplex(
    ctx: CanvasRenderingContext2D,
    getHashValue: Function,
    baseHue: number,
    saturation: number,
    lightness: number,
    width: number,
    height: number
  ): void {
    // 组合多种元素
    this.drawRectangles(
      ctx,
      getHashValue,
      baseHue,
      saturation,
      lightness,
      width,
      height
    );
    this.drawCircles(
      ctx,
      getHashValue,
      (baseHue + 120) % 360,
      saturation,
      lightness,
      width,
      height
    );
    this.drawLines(
      ctx,
      getHashValue,
      (baseHue + 240) % 360,
      saturation,
      lightness,
      width,
      height
    );

    // 添加一些装饰性元素
    const numDecorations = 5 + getHashValue(10);
    for (let i = 0; i < numDecorations; i++) {
      const x = getHashValue(width);
      const y = getHashValue(height);
      const size = 2 + getHashValue(4);

      const color = this.hslToRgb(
        (baseHue + getHashValue(360)) % 360,
        saturation * 1.2,
        lightness * 0.8
      );

      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }

  private hslToRgb(
    h: number,
    s: number,
    l: number
  ): { r: number; g: number; b: number } {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }
}
