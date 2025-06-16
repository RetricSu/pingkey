import dynamic from "next/dynamic";

const PowHashArt = dynamic(() => import("./pow-hash-art").then(mod => ({ default: mod.PowHashArt })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-neutral-200 dark:bg-neutral-600 rounded-sm animate-pulse flex items-center justify-center">
      <svg
        className="w-4 h-4 text-neutral-400 dark:text-neutral-500"
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
  ),
});

interface StampProps {
  hash?: string;
  showArt?: boolean;
}

export function Stamp({ hash, showArt = false }: StampProps) {
  const countLeadingZeros = (hash: string) => {
    let count = 0;
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === "0") {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  const leadingZeros = hash ? countLeadingZeros(hash) : 0;
  return (
    <div className="relative transform rotate-1 hover:rotate-0 transition-transform duration-300">
      <div className="relative w-12 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 border-2 border-blue-300 dark:border-blue-700 rounded-sm shadow-sm">
        {/* Perforated edges effect */}
        <div className="absolute inset-0 bg-white dark:bg-neutral-800 m-1 rounded-sm overflow-hidden">
          {/* Top perforations */}
          <div className="absolute -top-1 left-0 right-0 h-2 bg-blue-100 dark:bg-blue-900">
            <div className="flex justify-between px-1">
              {[...Array(6)].map((_, i) => (
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
              {[...Array(6)].map((_, i) => (
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
              {[...Array(8)].map((_, i) => (
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
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-white dark:bg-neutral-800 rounded-full mr-0.5"
                ></div>
              ))}
            </div>
          </div>
          {/* Image container */}
          <div className="p-1 h-full flex items-center justify-center">
            <div className="w-8 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-sm flex items-center justify-center overflow-hidden">
              {showArt ? (
                <PowHashArt
                  hash={hash}
                  leadingZeros={leadingZeros}
                  width={32}
                  height={40}
                  className="rounded-sm"
                />
              ) : (
                <svg
                  className="w-4 h-4 text-neutral-400 dark:text-neutral-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
