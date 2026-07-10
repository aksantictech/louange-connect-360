import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  tone?: "purple" | "gold" | "green" | "red";
};

const toneClasses = {
  purple: "bg-[var(--louange-purple)] text-white",
  gold: "bg-[var(--louange-gold)] text-black",
  green: "bg-[var(--louange-success)] text-white",
  red: "bg-[var(--louange-danger)] text-white",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "purple",
}: StatCardProps) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">{title}</p>

          <p className="mt-2 text-3xl font-black text-gray-950">
            {value}
          </p>

          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        <div className={`rounded-2xl p-3 ${toneClasses[tone]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}