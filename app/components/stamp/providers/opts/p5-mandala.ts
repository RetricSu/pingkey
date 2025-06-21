import { HashArtProvider, HashArtRenderParams } from "../types";

export class P5MandalaProvider implements HashArtProvider {
  id = "p5-mandala";
  name = "P5.js Mandala Art";
  description =
    "Sacred geometry mandalas with increasing symmetry based on POW difficulty";

  private sketch: any = null;
  private isCleaningUp = false;

  async render(params: HashArtRenderParams): Promise<void> {
    const { hash, leadingZeros, width, height, container } = params;

    // 清理现有的canvas
    this.cleanup();

    // 生成当前使用的hash
    const currentHash = hash || this.generateSimulatedHash(leadingZeros);
    const currentLeadingZeros = hash
      ? this.countLeadingZeros(hash)
      : leadingZeros;

    try {
      // 动态导入 p5.js
      const p5Module = await import("p5");
      const p5 = p5Module.default;

      const sketch = (p: any) => {
        p.setup = () => {
          try {
            const canvas = p.createCanvas(width, height);
            canvas.parent(container);
            // Center the canvas within its container
            const canvasElement = canvas.canvas;
            canvasElement.style.display = "block";
            canvasElement.style.margin = "0 auto";

            p.noLoop();
            p.angleMode(p.DEGREES);
            this.drawMandala(
              p,
              currentHash,
              currentLeadingZeros,
              width,
              height
            );
          } catch (setupError) {
            console.error("Error in p5.js setup:", setupError);
            // 在出错时绘制一个简单的错误占位符
            p.background(240);
            p.fill(200);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("Mandala Error", width / 2, height / 2);
          }
        };
      };

      this.sketch = new p5(sketch);
    } catch (error) {
      console.error("Failed to load p5.js or create sketch:", error);
      throw error;
    }
  }

  cleanup(): void {
    if (this.sketch && !this.isCleaningUp) {
      this.isCleaningUp = true;
      try {
        // 只停止循环，不删除DOM
        if (this.sketch.noLoop) {
          this.sketch.noLoop();
        }
      } catch (error) {
        console.debug("P5.js cleanup error:", error);
      } finally {
        this.sketch = null;
        this.isCleaningUp = false;
      }
    }
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

  private drawMandala(
    p: any,
    hashStr: string,
    zeros: number,
    width: number,
    height: number
  ): void {
    p.clear();

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

    // 设置颜色模式和基础参数
    p.colorMode(p.HSB, 360, 100, 100, 100);
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.45;

    // 基础颜色从hash中获取
    const baseHue = getHashValue(360);
    const baseSaturation = p.map(zeros, 0, 8, 60, 90);
    const baseBrightness = p.map(zeros, 0, 8, 80, 95);

    // 背景
    p.background(baseHue, baseSaturation * 0.1, baseBrightness * 0.95);

    p.push();
    p.translate(centerX, centerY);

    // 根据leading zeros决定曼陀罗的复杂度
    if (zeros === 0) {
      // 简单花瓣曼陀罗
      this.drawSimplePetalMandala(
        p,
        getHashValue,
        baseHue,
        baseSaturation,
        baseBrightness,
        maxRadius
      );
    } else if (zeros <= 2) {
      // 几何环形曼陀罗
      this.drawRingMandala(
        p,
        getHashValue,
        baseHue,
        baseSaturation,
        baseBrightness,
        maxRadius
      );
    } else if (zeros <= 4) {
      // 复合几何曼陀罗
      this.drawGeometricMandala(
        p,
        getHashValue,
        baseHue,
        baseSaturation,
        baseBrightness,
        maxRadius
      );
    } else if (zeros <= 6) {
      // 复杂分层曼陀罗
      this.drawLayeredMandala(
        p,
        getHashValue,
        baseHue,
        baseSaturation,
        baseBrightness,
        maxRadius
      );
    } else {
      // 神圣几何曼陀罗
      this.drawSacredMandala(
        p,
        getHashValue,
        baseHue,
        baseSaturation,
        baseBrightness,
        maxRadius
      );
    }

    p.pop();
  }

  private drawSimplePetalMandala(
    p: any,
    getHashValue: Function,
    baseHue: number,
    saturation: number,
    brightness: number,
    maxRadius: number
  ): void {
    const petalCount = 6 + getHashValue(6); // 6-12个花瓣
    const angleStep = 360 / petalCount;

    p.noStroke();

    // 绘制花瓣
    for (let i = 0; i < petalCount; i++) {
      const angle = i * angleStep;
      const petalHue = (baseHue + getHashValue(60)) % 360;

      p.push();
      p.rotate(angle);

      // 花瓣渐变色
      for (let r = maxRadius * 0.8; r > 0; r -= 5) {
        const alpha = p.map(r, 0, maxRadius * 0.8, 100, 20);
        const currentBrightness = p.map(
          r,
          0,
          maxRadius * 0.8,
          brightness * 0.6,
          brightness
        );

        p.fill(petalHue, saturation, currentBrightness, alpha);
        p.ellipse(0, -r * 0.5, r * 0.4, r * 0.8);
      }

      p.pop();
    }

    // 中心圆
    p.fill(baseHue, saturation * 0.5, brightness, 90);
    p.ellipse(0, 0, maxRadius * 0.3, maxRadius * 0.3);
  }

  private drawRingMandala(
    p: any,
    getHashValue: Function,
    baseHue: number,
    saturation: number,
    brightness: number,
    maxRadius: number
  ): void {
    const ringCount = 3 + getHashValue(2); // 3-5个环
    const symmetry = 8 + getHashValue(8); // 8-16重对称

    p.strokeWeight(1);

    // 绘制同心环
    for (let ring = 0; ring < ringCount; ring++) {
      const ringRadius = maxRadius * (0.2 + ring * 0.2);
      const ringHue = (baseHue + ring * 30) % 360;

      // 每个环的装饰元素
      for (let i = 0; i < symmetry; i++) {
        const angle = (360 / symmetry) * i;

        p.push();
        p.rotate(angle);

        // 径向线条
        p.stroke(ringHue, saturation, brightness, 70);
        p.line(ringRadius * 0.8, 0, ringRadius * 1.2, 0);

        // 小圆点装饰
        p.noStroke();
        p.fill(ringHue, saturation * 0.8, brightness, 80);
        p.ellipse(ringRadius, 0, 3, 3);

        p.pop();
      }

      // 环形边界
      p.noFill();
      p.stroke(ringHue, saturation * 0.6, brightness * 0.8, 40);
      p.ellipse(0, 0, ringRadius * 2, ringRadius * 2);
    }

    // 中心装饰
    p.noStroke();
    p.fill(baseHue, saturation, brightness, 100);
    p.ellipse(0, 0, maxRadius * 0.15, maxRadius * 0.15);
  }

  private drawGeometricMandala(
    p: any,
    getHashValue: Function,
    baseHue: number,
    saturation: number,
    brightness: number,
    maxRadius: number
  ): void {
    const layers = 4 + getHashValue(2); // 4-6层
    const symmetry = 12; // 12重对称

    // 绘制多层几何图案
    for (let layer = 0; layer < layers; layer++) {
      const layerRadius = maxRadius * (0.15 + layer * 0.15);
      const layerHue = (baseHue + layer * 45) % 360;
      const sides = 3 + getHashValue(3); // 三角形到六边形

      for (let i = 0; i < symmetry; i++) {
        const angle = (360 / symmetry) * i;

        p.push();
        p.rotate(angle);
        p.translate(layerRadius, 0);

        // 绘制多边形
        p.noFill();
        p.stroke(layerHue, saturation, brightness, 60);
        p.strokeWeight(0.5);

        p.beginShape();
        for (let s = 0; s < sides; s++) {
          const sAngle = (360 / sides) * s;
          const sRadius = layerRadius * 0.1;
          const x = p.cos(sAngle) * sRadius;
          const y = p.sin(sAngle) * sRadius;
          p.vertex(x, y);
        }
        p.endShape(p.CLOSE);

        // 填充中心
        p.noStroke();
        p.fill(layerHue, saturation * 0.7, brightness, 30);
        p.ellipse(0, 0, layerRadius * 0.08, layerRadius * 0.08);

        p.pop();
      }
    }
  }

  private drawLayeredMandala(
    p: any,
    getHashValue: Function,
    baseHue: number,
    saturation: number,
    brightness: number,
    maxRadius: number
  ): void {
    const mainSymmetry = 16; // 主要对称性
    const subSymmetry = 8; // 次要对称性

    // 外层复杂图案
    for (let i = 0; i < mainSymmetry; i++) {
      const angle = (360 / mainSymmetry) * i;
      const patternHue = (baseHue + i * 15) % 360;

      p.push();
      p.rotate(angle);

      // 主要图案元素
      p.noFill();
      p.stroke(patternHue, saturation, brightness, 70);
      p.strokeWeight(1);

      // 复杂的曲线图案
      p.beginShape();
      p.noFill();
      for (let t = 0; t < 360; t += 10) {
        const r = maxRadius * 0.3 + Math.sin(t * 3) * maxRadius * 0.1;
        const x = p.cos(t) * r;
        const y = p.sin(t) * r;
        p.vertex(x, y);
      }
      p.endShape();

      // 内层装饰
      for (let j = 0; j < subSymmetry; j++) {
        const subAngle = (360 / subSymmetry) * j;
        const subRadius = maxRadius * (0.6 + j * 0.05);

        p.push();
        p.rotate(subAngle);

        p.noStroke();
        p.fill(patternHue, saturation * 0.8, brightness, 50);

        // 小装饰元素
        p.beginShape();
        p.vertex(subRadius - 5, -2);
        p.vertex(subRadius + 5, -2);
        p.vertex(subRadius + 5, 2);
        p.vertex(subRadius - 5, 2);
        p.endShape(p.CLOSE);

        p.pop();
      }

      p.pop();
    }

    // 中心复杂装饰
    p.noStroke();
    for (let i = 0; i < 360; i += 15) {
      const centerHue = (baseHue + i) % 360;
      p.fill(centerHue, saturation, brightness, 80);

      p.push();
      p.rotate(i);
      p.ellipse(maxRadius * 0.1, 0, 3, 8);
      p.pop();
    }
  }

  private drawSacredMandala(
    p: any,
    getHashValue: Function,
    baseHue: number,
    saturation: number,
    brightness: number,
    maxRadius: number
  ): void {
    const goldenRatio = 1.618;
    const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21];

    // 使用黄金比例和斐波那契数列创建神圣几何

    // 外层螺旋图案
    for (let spiral = 0; spiral < 3; spiral++) {
      const spiralHue = (baseHue + spiral * 120) % 360;

      p.noFill();
      p.stroke(spiralHue, saturation, brightness, 60);
      p.strokeWeight(0.8);

      p.beginShape();
      for (let angle = 0; angle < 720; angle += 2) {
        const radius = (maxRadius * 0.8 * (angle / 720)) / goldenRatio;
        const x = p.cos(angle + spiral * 120) * radius;
        const y = p.sin(angle + spiral * 120) * radius;
        p.vertex(x, y);
      }
      p.endShape();
    }

    // 斐波那契圆环
    for (let i = 0; i < fibonacci.length && i < 6; i++) {
      const fibRadius = maxRadius * (fibonacci[i] / 21);
      const fibHue = (baseHue + i * 51.4) % 360; // 黄金角度

      // 每个斐波那契环的装饰
      const pointCount = fibonacci[i] * 3;
      for (let j = 0; j < pointCount; j++) {
        const angle = (360 / pointCount) * j * goldenRatio;

        p.push();
        p.rotate(angle);

        // 复杂的几何装饰
        p.noStroke();
        p.fill(fibHue, saturation * 0.9, brightness, 70);

        // 黄金比例矩形
        const rectWidth = fibRadius * 0.1;
        const rectHeight = rectWidth / goldenRatio;

        p.rect(fibRadius, 0, rectWidth, rectHeight);

        // 连接线
        p.stroke(fibHue, saturation * 0.5, brightness, 30);
        p.strokeWeight(0.3);
        p.line(0, 0, fibRadius, 0);

        p.pop();
      }

      // 环形边界
      p.noFill();
      p.stroke(fibHue, saturation * 0.4, brightness, 40);
      p.strokeWeight(0.5);
      p.ellipse(0, 0, fibRadius * 2, fibRadius * 2);
    }

    // 中心神圣几何
    const centerElements = 24; // 24重对称，神圣数字
    for (let i = 0; i < centerElements; i++) {
      const angle = (360 / centerElements) * i;
      const elementHue = (baseHue + angle) % 360;

      p.push();
      p.rotate(angle);

      // 复杂的中心装饰
      p.noFill();
      p.stroke(elementHue, saturation, brightness, 80);
      p.strokeWeight(1);

      // 生命之花元素
      for (let petal = 0; petal < 6; petal++) {
        const petalAngle = petal * 60;
        p.push();
        p.rotate(petalAngle);

        const petalRadius = maxRadius * 0.08;
        p.ellipse(petalRadius, 0, petalRadius * 0.6, petalRadius * 0.6);

        p.pop();
      }

      p.pop();
    }

    // 最终中心点
    p.noStroke();
    p.fill(baseHue, saturation, brightness, 100);
    p.ellipse(0, 0, maxRadius * 0.03, maxRadius * 0.03);
  }
}
