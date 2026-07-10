"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase/client";

const activityTypes = [
  "Culte dimanche",
  "Culte semaine",
  "Séminaire",
  "Réunion de prière",
  "Évangélisation",
  "Enseignement",
  "Veillée",
  "Formation",
  "Autre",
];

export default function CellActivitiesClient() {
  const [cellId, setCellId] = useState("");
  const [cellName, setCellName] = useState("");

  const [form, setForm] = useState({
    activity_type: "Culte dimanche",
    activity_title: "",
    activity_date: "",
    start_time: "",
    end_time: "",
    speaker_name: "",
    location: "",
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

  const [activities, setActivities] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    const { data: authData } = await supabase.auth.getUser();

    const user = authData.user;

    if (!user) {
      setErrorMessage("Utilisateur non connecté.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("assigned_cell_id")
      .eq("id", user.id)
      .single();

    if (!profile?.assigned_cell_id) {
      setErrorMessage("Aucune cellule rattachée à ce compte.");
      return;
    }

    setCellId(profile.assigned_cell_id);

    const { data: cell } = await supabase
      .from("cells")
      .select("name, code")
      .eq("id", profile.assigned_cell_id)
      .single();

    if (cell) {
      setCellName(`${cell.name} (${cell.code})`);
    }

    const { data: list } = await supabase
      .from("activities")
      .select("*")
      .eq("cell_id", profile.assigned_cell_id)
      .order("activity_date", { ascending: false })
      .limit(20);

    setActivities(list || []);
  }

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function numberOrZero(value: string) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  function emptyToNull(value: string) {
    const cleaned = value.trim();
    return cleaned ? cleaned : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!cellId) {
      setErrorMessage("Cellule introuvable.");
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

    const { error } = await supabase.from("activities").insert({
      cell_id: cellId,
      activity_type: form.activity_type,
      activity_title: emptyToNull(form.activity_title),
      activity_day_type: form.activity_type.toLowerCase().includes("dimanche")
        ? "dimanche"
        : "semaine",
      activity_date: form.activity_date,
      start_time: emptyToNull(form.start_time),
      end_time: emptyToNull(form.end_time),
      speaker_name: emptyToNull(form.speaker_name),
      responsible_name: emptyToNull(form.speaker_name),
      location: emptyToNull(form.location),

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
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Activité enregistrée avec succès.");
    loadInitialData();
  }

  return (
    <div>
      <PageHeader
        title="Activités de la cellule"
        description={`Saisie limitée à la cellule : ${cellName || "chargement..."}`}
      />

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

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Type d’activité"
            value={form.activity_type}
            onChange={(value) => updateField("activity_type", value)}
            options={activityTypes}
          />

          <Input
            label="Date"
            type="date"
            value={form.activity_date}
            onChange={(value) => updateField("activity_date", value)}
            required
          />

          <Input
            label="Titre / thème"
            value={form.activity_title}
            onChange={(value) => updateField("activity_title", value)}
          />

          <Input
            label="Intervenant"
            value={form.speaker_name}
            onChange={(value) => updateField("speaker_name", value)}
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
            label="Hommes"
            value={form.men_count}
            onChange={(value) => updateField("men_count", value)}
          />

          <Input
            label="Femmes"
            value={form.women_count}
            onChange={(value) => updateField("women_count", value)}
          />

          <Input
            label="Enfants"
            value={form.children_count}
            onChange={(value) => updateField("children_count", value)}
          />

          <Input
            label="Serviteurs présents"
            value={form.servants_count}
            onChange={(value) => updateField("servants_count", value)}
          />

          <Input
            label="Nouveaux convertis"
            value={form.new_converts_count}
            onChange={(value) => updateField("new_converts_count", value)}
          />

          <Input
            label="Nouveaux arrivants"
            value={form.new_visitors_count}
            onChange={(value) => updateField("new_visitors_count", value)}
          />

          <Textarea
            label="Résumé"
            value={form.summary}
            onChange={(value) => updateField("summary", value)}
          />

          <Textarea
            label="Besoins / recommandations"
            value={form.needs}
            onChange={(value) => updateField("needs", value)}
          />
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white"
        >
          <Save size={18} />
          Enregistrer l’activité
        </button>
      </form>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h3 className="text-xl font-black text-gray-950">
          Dernières activités
        </h3>

        <div className="mt-4 space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <p className="font-black text-gray-950">
                {activity.activity_type} — {activity.activity_date}
              </p>
              <p className="text-sm text-gray-500">
                Participants : {activity.total_attendance || activity.participants_count || 0}
              </p>
            </div>
          ))}
        </div>
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
      <label className="mb-2 block text-sm font-bold text-gray-800">{label}</label>
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
      <label className="mb-2 block text-sm font-bold text-gray-800">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
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
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-bold text-gray-800">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      />
    </div>
  );
}