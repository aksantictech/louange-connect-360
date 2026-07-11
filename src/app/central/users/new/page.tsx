"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
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
  { value: "super_admin", label: "Super administrateur" },
  { value: "admin_central", label: "Administrateur central" },
  { value: "pasteur_visionnaire", label: "Pasteur visionnaire" },
  { value: "pasteur_principal", label: "Pasteur principal" },
  { value: "pasteur_titulaire", label: "Pasteur titulaire" },
  { value: "coordonnateur_finances", label: "Financier / Coordonnateur finances" },
  { value: "logisticien", label: "Logisticien" },
  { value: "cellule", label: "Utilisateur cellule" },
  { value: "pasteur_cellule", label: "Pasteur de cellule" },
  { value: "tresorier_cellule", label: "Trésorier cellule" },
  { value: "secretaire_cellule", label: "Secrétaire cellule" },
  { value: "serviteur", label: "Serviteur" },
];

const cellLimitedRoles = [
  "cellule",
  "pasteur_cellule",
  "tresorier_cellule",
  "secretaire_cellule",
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
      const { data, error } = await supabase
        .from("cells")
        .select("id, name, code, country, city")
        .order("name", { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

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

    if (!form.full_name.trim()) {
      setErrorMessage("Le nom complet est obligatoire.");
      return;
    }

    if (!form.email.trim()) {
      setErrorMessage("L’email est obligatoire.");
      return;
    }

    if (form.password.length < 6) {
      setErrorMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (cellLimitedRoles.includes(form.role) && !form.assigned_cell_id) {
      setErrorMessage("Ce rôle doit être rattaché à une cellule.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          assigned_cell_id: cellLimitedRoles.includes(form.role)
            ? form.assigned_cell_id
            : null,
        }),
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};

      if (!response.ok) {
        setErrorMessage(
          result.error || "Erreur pendant la création de l’utilisateur."
        );
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
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erreur inconnue pendant la création."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const requiresCell = cellLimitedRoles.includes(form.role);

  return (
    <div>
      <PageHeader
        title="Créer un utilisateur"
        description="Créez un accès central, financier, pastoral ou un accès limité à une cellule."
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

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="mb-6 flex items-start gap-4 rounded-3xl bg-[var(--louange-bg)] p-5">
          <div className="rounded-2xl bg-[var(--louange-purple)] p-3 text-white">
            <UserPlus size={24} />
          </div>

          <div>
            <h3 className="text-xl font-black text-gray-950">
              Nouvel accès utilisateur
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Les rôles cellule, pasteur de cellule, trésorier cellule et
              secrétaire cellule sont limités à une cellule spécifique.
            </p>
          </div>
        </div>

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

        <form onSubmit={handleSubmit}>
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
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
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

              <p className="mt-1 text-xs font-semibold text-gray-500">
                Minimum 6 caractères.
              </p>
            </div>

            <Select
              label="Niveau d’accès"
              value={form.role}
              onChange={(value) => {
                updateField("role", value);

                if (!cellLimitedRoles.includes(value)) {
                  updateField("assigned_cell_id", "");
                }
              }}
              options={roles}
              required
            />

            {requiresCell ? (
              <div className="md:col-span-2">
                <Select
                  label="Cellule rattachée"
                  value={form.assigned_cell_id}
                  onChange={(value) => updateField("assigned_cell_id", value)}
                  options={cells.map((cell) => ({
                    value: cell.id,
                    label: `${cell.name} (${cell.code}) - ${
                      cell.country || "-"
                    } / ${cell.city || "-"}`,
                  }))}
                  required
                />

                <div className="mt-3 flex items-start gap-3 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                  <ShieldCheck size={18} className="mt-0.5" />
                  <p>
                    Cet utilisateur verra uniquement les données de la cellule
                    rattachée dans l’espace cellule.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            <Save size={18} />
            {isLoading ? "Création en cours..." : "Créer l’utilisateur"}
          </button>
        </form>
      </section>
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