import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-2xl font-black text-gray-950">{title}</h2>

        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}