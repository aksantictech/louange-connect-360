"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Cell = {
  id: string;
  code: string;
  name: string;
  country: string;
  province: string | null;
  city: string | null;
  commune: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  pastor_name: string | null;
  pastor_phone: string | null;
  secretary_name: string | null;
  secretary_phone: string | null;
  treasurer_name: string | null;
  treasurer_phone: string | null;
  main_service_day: string | null;
  main_service_time: string | null;
  status: string | null;
};

export default function CellEditForm({ cell }: { cell: Cell }) {
  const router = useRouter();

  const [form, setForm] = useState({
    code: cell.code || "",
    name: cell.name || "",
    country: cell.country || "",
    province: cell.province || "",
    city: cell.city || "",
    commune: cell.commune || "",
    address: cell.address || "",
    latitude: cell.latitude?.toString() || "",
    longitude: cell.longitude?.toString() || "",
    pastor_name: cell.pastor_name || "",
    pastor_phone: cell.pastor_phone || "",
    secretary_name: cell.secretary_name || "",
    secretary_phone: cell.secretary_phone || "",
    treasurer_name: cell.treasurer_name || "",
    treasurer_phone: cell.treasurer_phone || "",
    main_service_day: cell.main_service_day || "Dimanche",
    main_service_time: cell.main_service_time || "",
    status: cell.status || "active",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function emptyToNull(value: string) {
    const cleaned = value.trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  function numberOrNull(value: string) {
    const cleaned = value.trim();
    if (!cleaned) return null;
    const numberValue = Number(cleaned);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    const { error } = await supabase
      .from("cells")
      .update({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        country: form.country.trim(),
        province: emptyToNull(form.province),
        city: emptyToNull(form.city),
        commune: emptyToNull(form.commune),
        address: emptyToNull(form.address),
        latitude: numberOrNull(form.latitude),
        longitude: numberOrNull(form.longitude),
        pastor_name: emptyToNull(form.pastor_name),
        pastor_phone: emptyToNull(form.pastor_phone),
        secretary_name: emptyToNull(form.secretary_name),
        secretary_phone: emptyToNull(form.secretary_phone),
        treasurer_name: emptyToNull(form.treasurer_name),
        treasurer_phone: emptyToNull(form.treasurer_phone),
        main_service_day: emptyToNull(form.main_service_day),
        main_service_time: emptyToNull(form.main_service_time),
        status: form.status,
      })
      .eq("id", cell.id);

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/central/cells/${cell.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(form).map(([key, value]) => (
          <div key={key}>
            <label className="mb-2 block text-sm font-bold text-gray-800">
              {labelFor(key)}
            </label>

            {key === "status" ? (
              <select
                value={value}
                onChange={(event) => updateField(key as keyof typeof form, event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archivée</option>
                <option value="pending">En création</option>
              </select>
            ) : (
              <input
                value={value}
                onChange={(event) => updateField(key as keyof typeof form, event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white"
        >
          <Save size={18} />
          {isLoading ? "Modification..." : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}

function labelFor(key: string) {
  const labels: Record<string, string> = {
    code: "Code cellule",
    name: "Nom de la cellule",
    country: "Pays",
    province: "Province / Région",
    city: "Ville",
    commune: "Commune / Quartier",
    address: "Adresse",
    latitude: "Latitude",
    longitude: "Longitude",
    pastor_name: "Pasteur responsable",
    pastor_phone: "Téléphone pasteur",
    secretary_name: "Secrétaire",
    secretary_phone: "Téléphone secrétaire",
    treasurer_name: "Trésorier",
    treasurer_phone: "Téléphone trésorier",
    main_service_day: "Jour de culte",
    main_service_time: "Heure de culte",
    status: "Statut",
  };

  return labels[key] || key;
}