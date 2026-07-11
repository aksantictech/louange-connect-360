"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Cell = {
  id: string;
  name: string;
  code: string;
};

export default function AssetForm() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [form, setForm] = useState({
    cell_id: "",
    name: "",
    category: "Temple",
    location: "",
    acquisition_date: "",
    estimated_value: "",
    currency: "USD",
    condition: "Bon",
    description: "",
    status: "active",
  });

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCells() {
      const { data } = await supabase
        .from("cells")
        .select("id, name, code")
        .order("name", { ascending: true });

      setCells((data || []) as Cell[]);
    }

    loadCells();
  }, []);

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function emptyToNull(value: string) {
    const cleaned = value.trim();
    return cleaned ? cleaned : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("assets").insert({
      cell_id: form.cell_id || null,
      name: form.name.trim(),
      category: form.category,
      location: emptyToNull(form.location),
      acquisition_date: emptyToNull(form.acquisition_date),
      estimated_value: Number(form.estimated_value || 0),
      currency: form.currency,
      condition: form.condition,
      description: emptyToNull(form.description),
      status: form.status,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Patrimoine ajouté avec succès.");
    setForm({
      cell_id: "",
      name: "",
      category: "Temple",
      location: "",
      acquisition_date: "",
      estimated_value: "",
      currency: "USD",
      condition: "Bon",
      description: "",
      status: "active",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-5">
      {errorMessage ? (
        <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {message ? (
        <div className="mb-4 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Nom du bien"
          value={form.name}
          onChange={(value) => updateField("name", value)}
          required
        />

        <Select
          label="Catégorie"
          value={form.category}
          onChange={(value) => updateField("category", value)}
          options={["Temple", "Parcelle", "Maison", "Terrain", "Bureau", "Véhicule", "Matériel", "Mobilier", "Autre"]}
        />

        <Select
          label="Cellule / Église rattachée"
          value={form.cell_id}
          onChange={(value) => updateField("cell_id", value)}
          options={[
            { value: "", label: "Central / Non affecté" },
            ...cells.map((cell) => ({
              value: cell.id,
              label: `${cell.name} (${cell.code})`,
            })),
          ]}
        />

        <Input
          label="Localisation"
          value={form.location}
          onChange={(value) => updateField("location", value)}
        />

        <Input
          label="Date d’acquisition"
          type="date"
          value={form.acquisition_date}
          onChange={(value) => updateField("acquisition_date", value)}
        />

        <Input
          label="Valeur estimée"
          value={form.estimated_value}
          onChange={(value) => updateField("estimated_value", value)}
        />

        <Select
          label="Devise"
          value={form.currency}
          onChange={(value) => updateField("currency", value)}
          options={["USD", "CDF", "EUR"]}
        />

        <Select
          label="État"
          value={form.condition}
          onChange={(value) => updateField("condition", value)}
          options={["Excellent", "Bon", "Moyen", "À rénover", "Critique"]}
        />

        <div className="md:col-span-2">
          <Textarea
            label="Description"
            value={form.description}
            onChange={(value) => updateField("description", value)}
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white"
      >
        <Save size={18} />
        Ajouter le patrimoine
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | { value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      >
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;

          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      />
    </div>
  );
}