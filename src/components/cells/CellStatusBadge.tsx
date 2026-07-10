type CellStatusBadgeProps = {
  status?: string | null;
};

const statusConfig = {
  active: {
    label: "Active",
    className: "bg-green-50 text-green-700 ring-green-600/20",
  },
  pending: {
    label: "En création",
    className: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  },
  inactive: {
    label: "Inactive",
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
  archived: {
    label: "Archivée",
    className: "bg-gray-100 text-gray-600 ring-gray-500/20",
  },
};

export default function CellStatusBadge({ status }: CellStatusBadgeProps) {
  const safeStatus = status || "inactive";

  const config =
    statusConfig[safeStatus as keyof typeof statusConfig] ??
    statusConfig.inactive;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  );
}