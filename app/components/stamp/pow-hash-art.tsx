"use client";
import { useEffect, useRef, useState } from "react";
import { custom } from "../gadget/dialog";
import { getPow } from "nostr-tools/nip13";

interface PowHashArtProps {
  hash?: string;
  leadingZeros?: number;
  width?: number;
  height?: number;
  className?: string;
  clickable?: boolean;
}

// Expanded dialog component for showing the art in full size
function PowHashArtDialog({
  hash,
  leadingZeros,
  onResolve,
  onReject,
}: {
  hash?: string;
  leadingZeros?: number;
  onResolve: (result: any) => void;
  onReject: () => void;
}) {
  return (
    <div className="p-4 sm:p-6 max-w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          POW Stamp
        </h2>
        <button
          onClick={onReject}
          className="w-6 h-6 flex items-center justify-center text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex justify-center mb-6">
        <div className="w-full max-w-md flex justify-center">
          <PowHashArt
            hash={hash}
            leadingZeros={leadingZeros}
            width={320}
            height={400}
            className="border border-neutral-200 dark:border-neutral-700 rounded-lg"
            clickable={false}
          />
        </div>
      </div>

      <div className="text-center space-y-2 mb-6">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
          Hash:{" "}
          {hash ? `${hash.slice(0, 10)}...${hash.slice(-10)}` : "Simulated"}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Pow Difficulty: {hash ? getPow(hash) : "Unknown"}
        </p>
      </div>

      <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        <p className="mb-2">
          Every Pow Stamp is a unique piece of art<br/>
          determined by the hash of the message.
        </p>
        <p>The higher the difficulty, the more complex the stamp art.</p>
      </div>
    </div>
  );
}

export function PowHashArt({
  hash,
  leadingZeros = 0,
  width = 100,
  height = 120,
  className = "",
  clickable = true,
}: PowHashArtProps) {
  const sketchRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  // Function to count leading zeros in a hexadecimal string
  const countLeadingZeros = (hashStr: string): number => {
    let count = 0;
    for (let i = 0; i < hashStr.length; i++) {
      if (hashStr[i] === "0") {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  // Function to generate a simulated PoW hash
  const generateSimulatedHash = (
    numLeadingZeros: number,
    totalHashLength = 64
  ): string => {
    let hashStr = "0".repeat(Math.min(numLeadingZeros, totalHashLength));
    const remainingLength = totalHashLength - hashStr.length;
    const characters = "0123456789abcdef";
    for (let i = 0; i < remainingLength; i++) {
      hashStr += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return hashStr;
  };

  // Handle click to open expanded dialog
  const handleClick = async () => {
    if (!clickable) return;

    try {
      await custom(
        (props) => (
          <PowHashArtDialog
            hash={hash}
            leadingZeros={leadingZeros}
            {...props}
          />
        ),
        {
          maxWidth: "xl",
          closeOnBackdrop: true,
        }
      );
    } catch (error) {
      // User closed the dialog, no action needed
    }
  };

    useEffect(() => {
    // Only run on the client side
    if (typeof window === "undefined") return;
    
    setIsMounted(true);
    
    const initializeSketch = async () => {
      if (!containerElement) {
        return;
      }

      // Remove existing canvas if any
      if (sketchRef.current) {
        sketchRef.current.remove();
      }

      const currentHash = hash || generateSimulatedHash(leadingZeros);
      const currentLeadingZeros = hash ? countLeadingZeros(hash) : leadingZeros;

      try {
        // Dynamically import p5.js only on the client side
        const p5Module = await import("p5");
        const p5 = p5Module.default;

        const sketch = (p: any) => {
        p.setup = () => {
          const canvas = p.createCanvas(width, height);
          if (containerElement) {
            canvas.parent(containerElement);
          }
          p.noLoop();
          p.rectMode(p.CENTER);
          p.angleMode(p.DEGREES);
          drawArt(p, currentHash, currentLeadingZeros);
        };

        const drawArt = (p: any, hashStr: string, zeros: number) => {
          p.clear();

          // Convert hash to integer array for deterministic randomness
          const hashInts: number[] = [];
          for (let i = 0; i < hashStr.length; i += 2) {
            hashInts.push(parseInt(hashStr.substring(i, i + 2), 16));
          }

          let hashValueIndex = 0;
          const getHashValue = (maxVal = 255): number => {
            const value =
              hashInts[hashValueIndex % hashInts.length] % (maxVal + 1);
            hashValueIndex++;
            return value;
          };

          const baseHue = getHashValue(360);
          const currentSaturation = p.map(zeros, 0, 8, 10, 100);
          const currentBrightness = p.map(zeros, 0, 8, 30, 95);

          p.colorMode(p.HSB, 360, 100, 100, 100);

          // Define the drawing area
          const drawAreaWidth = width * 0.9;
          const drawAreaHeight = height * 0.9;
          const offsetX = (width - drawAreaWidth) / 2;
          const offsetY = (height - drawAreaHeight) / 2;

          p.push();
          p.translate(offsetX, offsetY);

          // Background helper
          const drawBackground = (
            hue: number,
            sat: number,
            bright: number,
            alpha: number
          ) => {
            p.noStroke();
            p.fill(hue, sat, bright, alpha);
            p.rect(
              drawAreaWidth / 2,
              drawAreaHeight / 2,
              drawAreaWidth,
              drawAreaHeight
            );
          };

          // Art generation based on leading zeros
          if (zeros === 0) {
            // Minimalist sketch
            drawBackground(
              baseHue,
              currentSaturation * 0.5,
              currentBrightness * 0.8,
              100
            );

            p.stroke(baseHue, 5, 40, 80);
            p.strokeWeight(0.5);
            p.noFill();

            // Simple abstract lines
            for (let i = 0; i < 3 + getHashValue(3); i++) {
              p.line(
                getHashValue(drawAreaWidth),
                getHashValue(drawAreaHeight),
                getHashValue(drawAreaWidth),
                getHashValue(drawAreaHeight)
              );
            }

            // Central soft shape
            p.fill(
              baseHue,
              currentSaturation * 0.7,
              currentBrightness * 0.9,
              50
            );
            p.noStroke();
            p.ellipse(
              drawAreaWidth / 2,
              drawAreaHeight / 2,
              drawAreaWidth * 0.6,
              drawAreaHeight * 0.6
            );
          } else if (zeros <= 2) {
            // Geometric abstract
            drawBackground(
              baseHue,
              currentSaturation * 0.7,
              currentBrightness * 0.9,
              100
            );

            p.noStroke();
            const numShapes = 4 + getHashValue(3);
            for (let i = 0; i < numShapes; i++) {
              const shapeHue = (baseHue + getHashValue(30)) % 360;
              const shapeSat =
                currentSaturation * (0.8 + getHashValue(20) / 100);
              const shapeBright =
                currentBrightness * (0.7 + getHashValue(30) / 100);

              p.fill(shapeHue, shapeSat, shapeBright, 90);
              p.push();
              p.translate(
                getHashValue(drawAreaWidth),
                getHashValue(drawAreaHeight)
              );
              p.rotate(getHashValue(360));

              if (getHashValue(1) === 0) {
                p.rect(
                  0,
                  0,
                  getHashValue(drawAreaWidth * 0.2) + 10,
                  getHashValue(drawAreaHeight * 0.2) + 10,
                  2
                );
              } else {
                p.ellipse(
                  0,
                  0,
                  getHashValue(drawAreaWidth * 0.2) + 10,
                  getHashValue(drawAreaHeight * 0.2) + 10
                );
              }
              p.pop();
            }
          } else if (zeros <= 4) {
            // Layered landscape
            p.noStroke();
            // Sky gradient
            for (let i = 0; i < drawAreaHeight; i++) {
              const inter = p.map(i, 0, drawAreaHeight, 0, 1);
              const c1 = p.color(
                (baseHue + 30) % 360,
                currentSaturation * 0.9,
                currentBrightness * 0.8,
                100
              );
              const c2 = p.color(
                (baseHue - 30 + 360) % 360,
                currentSaturation,
                currentBrightness,
                100
              );
              const c = p.lerpColor(c1, c2, inter);
              p.stroke(c);
              p.line(0, i, drawAreaWidth, i);
            }

            // Ground layers
            const numLayers = 2 + getHashValue(1);
            for (let k = 0; k < numLayers; k++) {
              const layerHue = (baseHue + getHashValue(60) + k * 15) % 360;
              const layerSat =
                currentSaturation * (0.7 + getHashValue(30) / 100);
              const layerBright =
                currentBrightness * (0.6 + getHashValue(30) / 100);

              p.fill(layerHue, layerSat, layerBright, 95);
              p.beginShape();
              p.curveVertex(0, drawAreaHeight);
              p.curveVertex(0, drawAreaHeight);

              for (let i = 0; i < 6; i++) {
                const x = p.map(i, 0, 5, 0, drawAreaWidth);
                const y = p.map(
                  getHashValue(100),
                  0,
                  100,
                  drawAreaHeight * (0.5 + k * 0.1),
                  drawAreaHeight * (0.8 + k * 0.05)
                );
                p.curveVertex(x, y);
              }
              p.curveVertex(drawAreaWidth, drawAreaHeight);
              p.curveVertex(drawAreaWidth, drawAreaHeight);
              p.endShape(p.CLOSE);
            }
          } else if (zeros <= 6) {
            // Dynamic cityscape
            p.noStroke();
            // Background gradient
            for (let i = 0; i < drawAreaHeight; i++) {
              const inter = p.map(i, 0, drawAreaHeight, 0, 1);
              const c1 = p.color(
                (baseHue + 200) % 360,
                currentSaturation,
                currentBrightness * 0.4,
                100
              );
              const c2 = p.color(
                (baseHue + 240) % 360,
                currentSaturation,
                currentBrightness * 0.8,
                100
              );
              const c = p.lerpColor(c1, c2, inter);
              p.stroke(c);
              p.line(0, i, drawAreaWidth, i);
            }

            p.noStroke();
            p.blendMode(p.MULTIPLY);

            const numBuildings = 4 + getHashValue(3);
            for (let i = 0; i < numBuildings; i++) {
              const buildingHue = (baseHue + getHashValue(180) + i * 20) % 360;
              p.fill(buildingHue, currentSaturation, currentBrightness, 80);
              const buildingWidth = getHashValue(drawAreaWidth * 0.15) + 8;
              const buildingHeight = getHashValue(drawAreaHeight * 0.5) + 20;
              const buildingX = getHashValue(drawAreaWidth);
              const buildingY = drawAreaHeight - buildingHeight / 2;

              p.rect(buildingX, buildingY, buildingWidth, buildingHeight, 2);
            }
            p.blendMode(p.BLEND);

            // Light points
            p.fill(255, 200, 0, 60);
            for (let i = 0; i < 15; i++) {
              p.ellipse(
                getHashValue(drawAreaWidth),
                getHashValue(drawAreaHeight * 0.7),
                2,
                2
              );
            }
          } else {
            // Vibrant crystalline
            p.noStroke();
            // Complex gradient
            for (let i = 0; i < drawAreaHeight; i++) {
              const inter = p.map(i, 0, drawAreaHeight, 0, 1);
              const c1 = p.color(
                (baseHue + 200) % 360,
                currentSaturation,
                currentBrightness * 0.6,
                100
              );
              const c2 = p.color(
                (baseHue + 300) % 360,
                currentSaturation,
                currentBrightness,
                100
              );
              const c = p.lerpColor(c1, c2, inter);
              p.stroke(c);
              p.line(0, i, drawAreaWidth, i);
            }

            p.noStroke();
            p.blendMode(p.ADD);

            const numLayers = 3 + getHashValue(1);
            for (let k = 0; k < numLayers; k++) {
              const crystalHue = (baseHue + getHashValue(360) + k * 30) % 360;
              const crystalSat =
                currentSaturation * (0.9 + getHashValue(10) / 100);
              const crystalBright =
                currentBrightness * (0.9 + getHashValue(10) / 100);

              p.fill(crystalHue, crystalSat, crystalBright, 10 + k * 5);
              const numVertices = 4 + getHashValue(3);
              p.beginShape();
              for (let i = 0; i < numVertices; i++) {
                const angle =
                  p.map(i, 0, numVertices, 0, 360) + getHashValue(30);
                const radius = p.map(
                  getHashValue(100),
                  0,
                  100,
                  drawAreaWidth * (0.1 + k * 0.03),
                  drawAreaWidth * (0.3 + k * 0.03)
                );
                const x = p.cos(angle) * radius + getHashValue(drawAreaWidth);
                const y = p.sin(angle) * radius + getHashValue(drawAreaHeight);
                p.vertex(x, y);
              }
              p.endShape(p.CLOSE);
            }
            p.blendMode(p.BLEND);

            // Sparkles
            p.fill(255, 255, 200, 70);
            for (let i = 0; i < 25; i++) {
              const starSize = 1 + getHashValue(2);
              p.rect(
                getHashValue(drawAreaWidth),
                getHashValue(drawAreaHeight),
                starSize,
                starSize,
                0.5
              );
            }
          }

          p.pop();
        };
      };

      sketchRef.current = new p5(sketch);
      } catch (error) {
        console.error("Failed to load p5.js or create sketch:", error);
      }
    };

    if (containerElement) {
      initializeSketch().catch(console.error);
    }

    return () => {
      if (sketchRef.current) {
        sketchRef.current.remove();
        sketchRef.current = null;
      }
    };
  }, [hash, leadingZeros, width, height, containerElement]);

  // Show placeholder during SSR and before client-side mount
  if (!isMounted) {
    return (
      <div
        className={`pow-hash-art ${className} bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center`}
        style={{ width, height }}
      >
        <div className="text-neutral-400 dark:text-neutral-600 text-xs">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setContainerElement}
      className={`pow-hash-art ${className} ${
        clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      }`}
      style={{ width, height }}
      onClick={handleClick}
      title={clickable ? "Click to view larger" : undefined}
    />
  );
}
