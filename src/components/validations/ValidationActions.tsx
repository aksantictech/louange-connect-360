"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type ValidationTable =
  | "finance_reports"
  | "finance_expense_reports"
  | "cell_monthly_reports";

type ValidationActionsProps = {
  table: ValidationTable;
  recordId: string;
  currentStatus?: string | null;
};

export default function ValidationActions({
  table,
  recordId,
  currentStatus,
}: ValidationActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function updateStatus(status: "validated" | "rejected") {
    const confirmed = window.confirm(
      status === "validated"
        ? "Confirmer la validation de cet élément ?"
        : "Confirmer le rejet de cet élément ?"
    );

    if (!confirmed) return;

    setIsLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    const { error } = await supabase
      .from(table)
      .update({
        status,
        validated_by: user?.id || null,
        validated_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  if (currentStatus === "validated") {
    return (
      <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 ring-1 ring-green-200">
        Déjà validé
      </span>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-200">
        Déjà rejeté
      </span>
    );
  }

  return (
    <div className={isLoading ? "flex gap-2 opacity-60" : "flex gap-2"}>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => updateStatus("validated")}
        className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-sm font-black text-white shadow-sm"
      >
        <CheckCircle2 size={16} />
        Valider
      </button>

      <button
        type="button"
        disabled={isLoading}
        onClick={() => updateStatus("rejected")}
        className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-700 ring-1 ring-red-200"
      >
        <XCircle size={16} />
        Rejeter
      </button>
    </div>
  );
}