"use client";

import { FileDown, Printer } from "lucide-react";

type PrintButtonProps = {
  label?: string;
  title?: string;
};

export default function PrintButton({
  label = "Imprimer / PDF",
  title = "Rapport Louange Connect 360",
}: PrintButtonProps) {
  function handlePrint() {
    const originalTitle = document.title;

    document.title = title;
    document.body.classList.add("printing-report");

    const cleanup = () => {
      document.body.classList.remove("printing-report");
      document.title = originalTitle;
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    setTimeout(() => {
      window.print();
    }, 150);

    setTimeout(cleanup, 3000);
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="no-print inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white shadow-sm"
    >
      <Printer size={18} />
      {label}
      <FileDown size={18} />
    </button>
  );
}