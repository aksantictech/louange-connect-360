"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

export default function CollapsibleSection({
  title,
  description,
  buttonLabel,
  children,
}: {
  title: string;
  description?: string;
  buttonLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-black text-gray-950">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white shadow-sm"
        >
          <Plus size={18} />
          {buttonLabel}
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {open ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}