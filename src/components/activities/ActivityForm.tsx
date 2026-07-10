"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Cell = {
  id: string;
  name: string;
  code: string;
};

const activityTypes = [
  "Culte dimanche",
  "Culte semaine",
  "Séminaire",
  "Réunion de prière",
  "Évangélisation",
  "Enseignement",
  "Veillée",
  "Réunion des serviteurs",
  "Formation",
  "Assistance sociale",
  "Autre",
];

export default function ActivityForm() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [form, setForm] = useState({
    cell_id: "",
    activity_type: "Culte dimanche",
    activity_title: "",
    activity_day_type: "dimanche",
    activity_date: "",
    start_time: "",
    end_time: "",
    location: "",
    speaker_name: "",
    men_count: "",
    women_count: "",
    children_count: "",
    servants_count: "",
    new_converts_count: "",
    new_visitors_count: "",
    summary: "",
    results: "",
    needs: "",
  });

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    return cleaned.length > 0 ? cleaned : null;
  }

  function numberOrZero(value: string) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");
    setIsLoading(true);

    if (!form.cell_id || !form.activity_date) {
      setIsLoading(false);
      setErrorMessage("La cellule et la date de l’activité sont obligatoires.");
      return;
    }

    const men = numberOrZero(form.men_count);
    const women = numberOrZero(form.women_count);
    const children = numberOrZero(form.children_count);
    const servants = numberOrZero(form.servants_count);
    const newConverts = numberOrZero(form.new_converts_count);
    const newVisitors = numberOrZero(form.new_visitors_count);

    const totalAttendance =
      men + women + children + servants + newConverts + newVisitors;

    const payload = {
      cell_id: form.cell_id,
      activity_type: form.activity_type,
      activity_title: emptyToNull(form.activity_title),
      activity_day_type: form.activity_day_type,
      activity_date: form.activity_date,
      start_time: emptyToNull(form.start_time),
      end_time: emptyToNull(form.end_time),
      location: emptyToNull(form.location),
      speaker_name: emptyToNull(form.speaker_name),
      responsible_name: emptyToNull(form.speaker_name),

      men_count: men,
      women_count: women,
      children_count: children,
      servants_count: servants,
      new_converts_count: newConverts,
      new_visitors_count: newVisitors,
      participants_count: totalAttendance,
      total_attendance: totalAttendance,

      summary: emptyToNull(form.summary),
      results: emptyToNull(form.results),
      needs: emptyToNull(form.needs),
    };

    const { error } = await supabase.from("activities").insert(payload);

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Activité enregistrée avec succès. Le rapport sera disponible dans le menu Rapports.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
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

      <div className="mb-6 rounded-3xl border border-[var(--louange-gold)] bg-[var(--louange-bg)] p-5">
        <h3 className="text-lg font-black text-gray-950">
          Rapport d’activité
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Les présences sont enregistrées ici. Les finances sont déclarées séparément dans le module Finance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Cellule"
          value={form.cell_id}
          onChange={(value) => updateField("cell_id", value)}
          options={cells.map((cell) => ({
            value: cell.id,
            label: `${cell.name} (${cell.code})`,
          }))}
          placeholder="Sélectionner une cellule"
          required
        />

        <Select
          label="Type d’activité"
          value={form.activity_type}
          onChange={(value) => {
            updateField("activity_type", value);
            updateField(
              "activity_day_type",
              value.toLowerCase().includes("dimanche") ? "dimanche" : "semaine"
            );
          }}
          options={activityTypes.map((item) => ({ value: item, label: item }))}
          placeholder="Sélectionner"
          required
        />

        <Input
          label="Titre / thème"
          value={form.activity_title}
          onChange={(value) => updateField("activity_title", value)}
          placeholder="Ex. Culte de célébration"
        />

        <Input
          label="Date"
          type="date"
          value={form.activity_date}
          onChange={(value) => updateField("activity_date", value)}
          required
        />

        <Input
          label="Heure début"
          type="time"
          value={form.start_time}
          onChange={(value) => updateField("start_time", value)}
        />

        <Input
          label="Heure fin"
          type="time"
          value={form.end_time}
          onChange={(value) => updateField("end_time", value)}
        />

        <Input
          label="Intervenant / prédicateur"
          value={form.speaker_name}
          onChange={(value) => updateField("speaker_name", value)}
          placeholder="Nom de l’intervenant"
        />

        <Input
          label="Lieu"
          value={form.location}
          onChange={(value) => updateField("location", value)}
          placeholder="Lieu de l’activité"
        />

        <Input
          label="Hommes"
          value={form.men_count}
          onChange={(value) => updateField("men_count", value)}
          placeholder="0"
        />

        <Input
          label="Femmes"
          value={form.women_count}
          onChange={(value) => updateField("women_count", value)}
          placeholder="0"
        />

        <Input
          label="Enfants"
          value={form.children_count}
          onChange={(value) => updateField("children_count", value)}
          placeholder="0"
        />

        <Input
          label="Serviteurs présents"
          value={form.servants_count}
          onChange={(value) => updateField("servants_count", value)}
          placeholder="0"
        />

        <Input
          label="Nouveaux convertis"
          value={form.new_converts_count}
          onChange={(value) => updateField("new_converts_count", value)}
          placeholder="0"
        />

        <Input
          label="Nouveaux arrivants"
          value={form.new_visitors_count}
          onChange={(value) => updateField("new_visitors_count", value)}
          placeholder="0"
        />

        <div className="md:col-span-2">
          <Textarea
            label="Résumé de l’activité"
            value={form.summary}
            onChange={(value) => updateField("summary", value)}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Résultats / observations"
            value={form.results}
            onChange={(value) => updateField("results", value)}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Besoins / recommandations"
            value={form.needs}
            onChange={(value) => updateField("needs", value)}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white"
        >
          <Save size={18} />
          {isLoading ? "Enregistrement..." : "Enregistrer l’activité"}
        </button>
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      />
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
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
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}