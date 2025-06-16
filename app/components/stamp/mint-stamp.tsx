import { CustomDialogProps } from "../dialog";
import { Stamp } from "./stamp";
import { Event } from "nostr-tools/core";

export function buildGeneratedStampDialog(
  powDifficulty: number,
  signedEvent: Event
) {
  const dialog = ({ onResolve, onReject }: CustomDialogProps<boolean>) => {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold mb-2">POW Stamp Generated!</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your message has been forged and ready to send with Proof of Work
            Stamp (Difficulty: {powDifficulty}). The Stamp will be used as a
            spam filter for relays. Higher difficulty means more spam-proof, but
            slower to forge.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <Stamp hash={signedEvent.id} showArt={true} />
        </div>

        <div className="text-center space-y-2 mb-6 overflow-x-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-mono">
              {signedEvent.id.slice(0, 10)}...{signedEvent.id.slice(-10)}
            </span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onResolve(true)}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send Message
          </button>
        </div>
      </div>
    );
  };

  return dialog;
}
