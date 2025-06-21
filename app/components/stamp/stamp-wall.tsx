import React from "react";
import { HashArtRenderer } from "./hash-art-renderer";
import { getPow } from "nostr-tools/nip13";

interface StampWallProps {
  eventIds: string[];
  columns?: 2 | 3 | 4;
  stampSize?: {
    width: number;
    height: number;
  };
}

export const StampWall: React.FC<StampWallProps> = ({
  eventIds,
  columns = 3,
  stampSize = { width: 120, height: 150 },
}) => {
  const gridClass = {
    2: "grid-cols-2 sm:grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }[columns];

  return (
    <section className="stamp-wall">
      <div className={`grid ${gridClass} gap-4 my-8`}>
        {eventIds.map((eventId) => {
          const powDifficulty = getPow(eventId);

          return (
            <div
              key={eventId}
              className="relative aspect-[4/5] hover:z-10 transition-all duration-300"
              style={{
                minWidth: `${stampSize.width}px`,
                minHeight: `${stampSize.height}px`,
              }}
            >
              <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 border-2 border-blue-300 dark:border-blue-700 rounded-sm shadow-sm transform hover:scale-105 hover:rotate-0 rotate-1 transition-all duration-300">
                {/* Stamp frame with perforated edges */}
                <div className="absolute inset-0 bg-white dark:bg-neutral-800 m-1 rounded-sm overflow-hidden">
                  {/* Top perforations */}
                  <div className="absolute -top-1 left-0 right-0 h-2 bg-blue-100 dark:bg-blue-900">
                    <div className="flex justify-between px-1">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 bg-white dark:bg-neutral-800 rounded-full mt-0.5"
                        ></div>
                      ))}
                    </div>
                  </div>
                  {/* Bottom perforations */}
                  <div className="absolute -bottom-1 left-0 right-0 h-2 bg-blue-100 dark:bg-blue-900">
                    <div className="flex justify-between px-1">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 bg-white dark:bg-neutral-800 rounded-full mb-0.5"
                        ></div>
                      ))}
                    </div>
                  </div>
                  {/* Left perforations */}
                  <div className="absolute -left-1 top-0 bottom-0 w-2 bg-blue-100 dark:bg-blue-900">
                    <div className="flex flex-col justify-between py-1 h-full">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 bg-white dark:bg-neutral-800 rounded-full ml-0.5"
                        ></div>
                      ))}
                    </div>
                  </div>
                  {/* Right perforations */}
                  <div className="absolute -right-1 top-0 bottom-0 w-2 bg-blue-100 dark:bg-blue-900">
                    <div className="flex flex-col justify-between py-1 h-full">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 bg-white dark:bg-neutral-800 rounded-full mr-0.5"
                        ></div>
                      ))}
                    </div>
                  </div>
                  {/* Art container */}
                  <div className="p-2 h-full flex items-center justify-center">
                    <div className="w-full h-full bg-neutral-100 dark:bg-neutral-700 rounded-sm flex items-center justify-center overflow-hidden">
                      <HashArtRenderer
                        hash={eventId}
                        width={Math.min(stampSize.width - 20, 100)}
                        height={Math.min(stampSize.height - 30, 120)}
                        className="rounded-sm"
                        clickable={true}
                      />
                    </div>
                  </div>
                  {/* Stamp info overlay */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black bg-opacity-50 text-white text-xs rounded px-1 py-0.5 text-center backdrop-blur-sm">
                      POW: {powDifficulty}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {eventIds.length === 0 && (
        <div className="text-center py-12">
          <div className="text-neutral-400 dark:text-neutral-600 mb-2">
            <svg
              className="w-12 h-12 mx-auto mb-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">
            No stamps collected yet
          </p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
            Send messages with POW to start collecting stamps
          </p>
        </div>
      )}
    </section>
  );
};
