"use client";

import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

export type DropdownAction = {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
};

export default function ActionDropdown({
  actions,
}: {
  actions: DropdownAction[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
        aria-label="Plus d’actions"
      >
        <MoreHorizontal size={20} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-transparent"
          />

          <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-gray-50 ${
                  action.danger ? "text-red-700" : "text-gray-700"
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}