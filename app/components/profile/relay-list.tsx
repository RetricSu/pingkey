import { RelayListItem } from "app/lib/type";
import { useRelayConnectivity } from "app/hooks/useRelayConnectivity";

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

  if (displayRelays.length === 0) {
    return (
      <div className={`mt-4 mb-6 pt-4 ${className}`}>
        <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
          {title}
        </h3>
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
      <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
        {title}
      </h3>

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
