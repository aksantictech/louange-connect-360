"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Save,
  XCircle,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase/client";

type AssetItem = {
  id: string;
  name: string | null;
  asset_type: string | null;
  category: string | null;
  location: string | null;
  estimated_value: number | null;
  currency: string | null;
  condition: string | null;
  description: string | null;
  status: string | null;
  created_at?: string | null;
};

type AssetFormState = {
  name: string;
  category: string;
  location: string;
  estimated_value: string;
  currency: string;
  condition: string;
  description: string;
};

const initialForm: AssetFormState = {
  name: "",
  category: "Matériel",
  location: "",
  estimated_value: "",
  currency: "USD",
  condition: "Bon",
  description: "",
};

export default function CellAssetsClient() {
  const [cellId, setCellId] = useState("");
  const [cellName, setCellName] = useState("");
  const [assets, setAssets] = useState<AssetItem[]>([]);

  const [form, setForm] = useState<AssetFormState>(initialForm);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setErrorMessage("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setErrorMessage("Utilisateur non connecté.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("assigned_cell_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.assigned_cell_id) {
      setErrorMessage("Aucune cellule n’est rattachée à ce compte.");
      return;
    }

    const assignedCellId = profile.assigned_cell_id;
    setCellId(assignedCellId);

    const { data: cell } = await supabase
      .from("cells")
      .select("name, code")
      .eq("id", assignedCellId)
      .single();

    if (cell) {
      setCellName(`${cell.name} (${cell.code})`);
    }

    const { data: list, error: assetsError } = await supabase
      .from("assets")
      .select(
        "id, name, asset_type, category, location, estimated_value, currency, condition, description, status, created_at"
      )
      .eq("cell_id", assignedCellId)
      .order("created_at", { ascending: false });

    if (assetsError) {
      setErrorMessage(assetsError.message);
      return;
    }

    setAssets((list || []) as AssetItem[]);
  }

  function updateField(name: keyof AssetFormState, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function cancelEdit() {
    setEditingAssetId(null);
    setForm(initialForm);
    setMessage("");
    setErrorMessage("");
  }

  function editAsset(asset: AssetItem) {
    setEditingAssetId(asset.id);

    setForm({
      name: asset.name || "",
      category: asset.category || asset.asset_type || "Matériel",
      location: asset.location || "",
      estimated_value: String(asset.estimated_value || ""),
      currency: asset.currency || "USD",
      condition: asset.condition || "Bon",
      description: asset.description || "",
    });

    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!cellId) {
      setErrorMessage("Cellule introuvable.");
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage("Le nom du patrimoine est obligatoire.");
      return;
    }

    setIsLoading(true);

    const payload = {
      cell_id: cellId,
      name: form.name.trim(),
      asset_type: form.category,
      category: form.category,
      location: form.location.trim() || null,
      estimated_value: Number(form.estimated_value || 0),
      currency: form.currency,
      condition: form.condition,
      description: form.description.trim() || null,
      status: "active",
    };

    const { error } = editingAssetId
      ? await supabase
          .from("assets")
          .update(payload)
          .eq("id", editingAssetId)
          .eq("cell_id", cellId)
      : await supabase.from("assets").insert(payload);

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      editingAssetId
        ? "Patrimoine modifié avec succès."
        : "Patrimoine ajouté avec succès."
    );

    setEditingAssetId(null);
    setForm(initialForm);
    setFormOpen(false);
    loadData();
  }

  const totalValue = assets.reduce((sum, item) => {
    return sum + Number(item.estimated_value || 0);
  }, 0);

  return (
    <div>
      <PageHeader
        title="Patrimoine de la cellule"
        description={`Biens et matériels rattachés à : ${
          cellName || "chargement..."
        }`}
      />

      {errorMessage ? (
        <div className="mb-5 rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {message ? (
        <div className="mb-5 rounded-3xl bg-green-50 p-5 text-sm font-bold text-green-700">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Biens enregistrés"
          value={String(assets.length)}
          subtitle="Patrimoine cellule"
          icon={Building2}
          tone="purple"
        />

        <StatCard
          title="Valeur estimée"
          value={`${totalValue.toLocaleString("fr-FR")} USD`}
          subtitle="Total indicatif"
          icon={Building2}
          tone="gold"
        />

        <StatCard
          title="Cellule"
          value={cellName || "-"}
          subtitle="Compte rattaché"
          icon={Building2}
          tone="purple"
        />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-black text-gray-950">
              {editingAssetId
                ? "Modifier un patrimoine"
                : "Ajouter un patrimoine"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Ajoutez ou modifiez un bien, matériel, équipement ou mobilier de votre cellule.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {editingAssetId ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700"
              >
                <XCircle size={18} />
                Annuler
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setFormOpen((current) => !current)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white shadow-sm"
            >
              <Plus size={18} />
              {editingAssetId ? "Formulaire ouvert" : "Ajouter un patrimoine"}
              {formOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {formOpen ? (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
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
              options={[
                "Matériel",
                "Mobilier",
                "Sono",
                "Chaise",
                "Instrument",
                "Terrain",
                "Local",
                "Maison",
                "Équipement informatique",
                "Autre",
              ]}
            />

            <Input
              label="Localisation"
              value={form.location}
              onChange={(value) => updateField("location", value)}
            />

            <Input
              label="Valeur estimée"
              type="number"
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
              options={["Excellent", "Bon", "Moyen", "À réparer", "Hors service"]}
            />

            <div className="md:col-span-2">
              <Textarea
                label="Description"
                value={form.description}
                onChange={(value) => updateField("description", value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              <Save size={18} />
              {isLoading
                ? "Enregistrement..."
                : editingAssetId
                  ? "Modifier"
                  : "Enregistrer"}
            </button>
          </form>
        ) : null}
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-5">
          <h3 className="text-xl font-black text-gray-950">
            Liste du patrimoine
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {assets.length} bien(s) enregistré(s).
          </p>
        </div>

        {assets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm font-semibold text-gray-500">
            Aucun patrimoine enregistré pour cette cellule.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-gray-950">
                      {asset.name || "-"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {asset.category || asset.asset_type || "-"} —{" "}
                      {asset.condition || "-"}
                    </p>
                  </div>

                  <span className="rounded-full bg-[var(--louange-gold-soft)] px-3 py-1 text-xs font-black text-[var(--louange-purple)]">
                    {asset.status || "active"}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <p>
                    <strong>Valeur :</strong>{" "}
                    {Number(asset.estimated_value || 0).toLocaleString("fr-FR")}{" "}
                    {asset.currency || "USD"}
                  </p>

                  <p>
                    <strong>Lieu :</strong> {asset.location || "-"}
                  </p>

                  {asset.description ? (
                    <p>
                      <strong>Description :</strong> {asset.description}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => editAsset(asset)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--louange-purple)] px-4 py-2 text-sm font-black text-[var(--louange-purple)]"
                >
                  <Pencil size={16} />
                  Modifier
                </button>
              </div>
            ))}
          </div>
        )}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
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
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      />
    </div>
  );
}