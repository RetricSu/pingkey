import { RelayListItem } from "app/lib/type";
import { useRelayConnectivity } from "app/hooks/useRelayConnectivity";
import { alert } from "app/components/gadget/dialog";
import { Tooltip } from "app/components/gadget/tooltip";

interface RelayListProps {
  relayList: RelayListItem[];
  title: string;
  className?: string;
  enableConnectivityCheck?: boolean;
  checkOnMount?: boolean;
}

function getStatusIndicator(relay: RelayListItem) {
  if (relay.isChecking) {
    return (
      <div
        className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
        title="Checking connectivity..."
      ></div>
    );
  }

  if (relay.isConnected === true) {
    return (
      <div
        className="w-2 h-2 bg-green-500 rounded-full"
        title="Connected"
      ></div>
    );
  }

  if (relay.isConnected === false) {
    return (
      <div
        className="w-2 h-2 bg-red-500 rounded-full"
        title="Connection failed"
      ></div>
    );
  }

  // Unknown status (not checked yet)
  return (
    <div
      className="w-2 h-2 bg-gray-400 rounded-full"
      title="Status unknown"
    ></div>
  );
}

export function RelayList({
  relayList,
  title,
  className = "",
  enableConnectivityCheck = true,
  checkOnMount = true,
}: RelayListProps) {
  const { relaysWithStatus } = useRelayConnectivity(relayList, checkOnMount);

  const displayRelays = enableConnectivityCheck ? relaysWithStatus : relayList;

  const titleSection = (
    <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2 relative">
      {title}
      <Tooltip
        content="Relays are servers that receive and store messages. They act as a bridge between users, allowing them to send and receive messages across the decentralized Nostr network. Users can configure multiple relays for better redundancy and reach."
        position="top"
      >
        <button
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          aria-label="More information about relays"
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
      </Tooltip>
    </h3>
  );

  if (displayRelays.length === 0) {
    return (
      <div className={`mt-4 mb-6 pt-4 ${className}`}>
        {title.length > 0 && titleSection}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <span>No relays found.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-4 mb-6 pt-4 ${className}`}>
      {title.length > 0 && titleSection}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
        {displayRelays.map((relay, index) => (
          <div key={index} className="flex items-center space-x-2">
            {enableConnectivityCheck ? (
              getStatusIndicator(relay)
            ) : (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            <span className="truncate" title={relay.url}>
              {relay.url}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
