import { RelayListItem } from "app/lib/type";

interface RelayListProps {
  relayList: RelayListItem[];
  title: string;
  className?: string;
}

export function RelayList({ relayList, title, className = "" }: RelayListProps) {
  if (relayList.length === 0) {
    return null;
  }

  return (
    <div className={`mt-4 mb-6 pt-4 ${className}`}>
      <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
        {relayList.map((relay, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{relay.url}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 
