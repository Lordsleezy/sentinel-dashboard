export default function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
      {label}
    </div>
  );
}
