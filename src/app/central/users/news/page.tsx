"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Save } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase/client";

type Cell = {
  id: string;
  name: string;
  code: string;
  country: string | null;
  city: string | null;
};

const roles = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin_central", label: "Admin central" },
  { value: "pasteur_visionnaire", label: "Pasteur visionnaire" },
  { value: "coordonnateur_finances", label: "Coordonnateur finances" },
  { value: "logisticien", label: "Logisticien" },
  { value: "cellule", label: "Utilisateur cellule" },
];

export default function NewUserPage() {
  const [cells, setCells] = useState<Cell[]>([]);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "cellule",
    assigned_cell_id: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadCells() {
      const { data } = await supabase
        .from("cells")
        .select("id, name, code, country, city")
        .order("name", { ascending: true });

      setCells((data || []) as Cell[]);
    }

    loadCells();
  }, []);

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");
    setIsLoading(true);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setErrorMessage(result.error || "Erreur pendant la création.");
      return;
    }

    setMessage("Utilisateur créé avec succès.");
    setForm({
      full_name: "",
      email: "",
      password: "",
      role: "cellule",
      assigned_cell_id: "",
    });
  }

  const isCellUser = form.role === "cellule";

  return (
    <div>
      <PageHeader
        title="Créer un utilisateur"
        description="Créez un accès et rattachez les utilisateurs cellule à leur cellule uniquement."
        action={
          <Link
            href="/central/users"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 shadow-sm"
          >
            <ArrowLeft size={18} />
            Retour
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
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
            label="Nom complet"
            value={form.full_name}
            onChange={(value) => updateField("full_name", value)}
            required
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => updateField("email", value)}
            required
          />

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-800">
              Mot de passe
            </label>
            <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                required
                className="w-full bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Select
            label="Niveau d’accès"
            value={form.role}
            onChange={(value) => {
              updateField("role", value);

              if (value !== "cellule") {
                updateField("assigned_cell_id", "");
              }
            }}
            options={roles}
            required
          />

          {isCellUser ? (
            <div className="md:col-span-2">
              <Select
                label="Cellule rattachée"
                value={form.assigned_cell_id}
                onChange={(value) => updateField("assigned_cell_id", value)}
                options={cells.map((cell) => ({
                  value: cell.id,
                  label: `${cell.name} (${cell.code}) - ${cell.country || ""} ${cell.city || ""}`,
                }))}
                required
              />
              <p className="mt-2 text-sm font-semibold text-gray-500">
                Cet utilisateur sera limité à cette cellule dans l’espace cellule.
              </p>
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white"
        >
          <Save size={18} />
          {isLoading ? "Création..." : "Créer l’utilisateur"}
        </button>
      </form>
    </div>
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
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      >
        <option value="">Sélectionner</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}