import { alert } from "app/components/dialog";
import ConnectWallet from "./wallet/connect-wallet";

export function ConnectWeb5() {
  return (
    <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center align-middle gap-2">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            Web5 DID Connection
            <button
              onClick={() =>
                alert(
                  "Web5 DID Connection",
                  "Connect your Web5 Decentralized Identity (DID) to enable enhanced features and cross-platform identity verification."
                )
              }
              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              title="More information"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </button>
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between py-3 px-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                No Web5 DID Connected
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Connect your decentralized identity for enhanced features
              </p>
            </div>
          </div>
          <ConnectWallet className="px-4 py-2 text-sm text-white dark:text-black bg-blue-600 dark:bg-blue-400 hover:bg-blue-700 dark:hover:bg-blue-300 rounded transition-colors" />
        </div>

        <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-800">
          <p className="mb-2">
            <strong>What is Web5 DID?</strong>
          </p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>Decentralized Identity that you own and control</li>
            <li>Enhanced cross-platform verification and authentication</li>
            <li>Secure, private identity management without intermediaries</li>
            <li>Seamless integration with Web5 ecosystem applications</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
