interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  PASS: "bg-green-100 text-green-800 border-green-200",
  FAIL: "bg-red-100 text-red-800 border-red-200",
  UNCLEAR: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-green-100 text-green-800 border-green-200",
  error: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PASS: "PASS",
  FAIL: "FAIL",
  UNCLEAR: "UNCLEAR",
  pending: "Pending",
  processing: "Processing",
  done: "Done",
  error: "Error",
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}
    >
      {label}
    </span>
  );
}
