interface LoaderProps {
  message?: string;
  minHeight?: string;
}

export function Loader({ message = "Loading...", minHeight = "min-h-[400px]" }: LoaderProps) {
  return (
    <div className={`flex items-center justify-center ${minHeight}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {message}
        </div>
      </div>
    </div>
  );
} 
