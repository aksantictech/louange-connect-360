"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Pencil,
  Plus,
  Save,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
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
  "Réunion des serviteurs",
  "Assistance sociale",
  "Autre",
];

type ActivityFormState = {
  activity_type: string;
  activity_title: string;
  activity_date: string;
  start_time: string;
  end_time: string;
  speaker_name: string;
  location: string;
  men_count: string;
  women_count: string;
  children_count: string;
  servants_count: string;
  new_converts_count: string;
  new_visitors_count: string;
  summary: string;
  results: string;
  needs: string;
};

const initialForm: ActivityFormState = {
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
};

export default function CellActivitiesClient() {
  const [cellId, setCellId] = useState("");
  const [cellName, setCellName] = useState("");
  const [form, setForm] = useState<ActivityFormState>(initialForm);

  const [activities, setActivities] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
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

    const { data: list, error: activitiesError } = await supabase
      .from("activities")
      .select("*")
      .eq("cell_id", assignedCellId)
      .order("activity_date", { ascending: false })
      .limit(30);

    if (activitiesError) {
      setErrorMessage(activitiesError.message);
      return;
    }

    setActivities(list || []);
  }

  function updateField(name: keyof ActivityFormState, value: string) {
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

  function cancelEdit() {
    setEditingActivityId(null);
    setForm(initialForm);
    setMessage("");
    setErrorMessage("");
  }

  function editActivity(activity: any) {
    setEditingActivityId(activity.id);

    setForm({
      activity_type: activity.activity_type || "Culte dimanche",
      activity_title: activity.activity_title || "",
      activity_date: activity.activity_date || "",
      start_time: activity.start_time || "",
      end_time: activity.end_time || "",
      speaker_name: activity.speaker_name || activity.responsible_name || "",
      location: activity.location || "",
      men_count: String(activity.men_count || ""),
      women_count: String(activity.women_count || ""),
      children_count: String(activity.children_count || ""),
      servants_count: String(activity.servants_count || ""),
      new_converts_count: String(activity.new_converts_count || ""),
      new_visitors_count: String(activity.new_visitors_count || ""),
      summary: activity.summary || "",
      results: activity.results || "",
      needs: activity.needs || "",
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

    if (!form.activity_date) {
      setErrorMessage("La date de l’activité est obligatoire.");
      return;
    }

    setIsLoading(true);

    const men = numberOrZero(form.men_count);
    const women = numberOrZero(form.women_count);
    const children = numberOrZero(form.children_count);
    const servants = numberOrZero(form.servants_count);
    const newConverts = numberOrZero(form.new_converts_count);
    const newVisitors = numberOrZero(form.new_visitors_count);

    const totalAttendance =
      men + women + children + servants + newConverts + newVisitors;

    const payload = {
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
    };

    const { error } = editingActivityId
      ? await supabase
          .from("activities")
          .update(payload)
          .eq("id", editingActivityId)
          .eq("cell_id", cellId)
      : await supabase.from("activities").insert(payload);

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      editingActivityId
        ? "Activité modifiée avec succès."
        : "Activité enregistrée avec succès."
    );

    setEditingActivityId(null);
    setForm(initialForm);
    setFormOpen(false);
    loadInitialData();
  }

  const totalActivities = activities.length;

  const totalParticipants = activities.reduce((sum, activity) => {
    return (
      sum +
      (Number(activity.total_attendance || 0) ||
        Number(activity.participants_count || 0))
    );
  }, 0);

  const totalNewPeople = activities.reduce((sum, activity) => {
    return (
      sum +
      Number(activity.new_converts_count || 0) +
      Number(activity.new_visitors_count || 0)
    );
  }, 0);

  const totalServants = activities.reduce((sum, activity) => {
    return sum + Number(activity.servants_count || 0);
  }, 0);

  return (
    <div>
      <PageHeader
        title="Activités de la cellule"
        description={`Saisie limitée à la cellule : ${
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Activités"
          value={String(totalActivities)}
          subtitle="Rapports encodés"
          icon={CalendarCheck}
          tone="purple"
        />

        <StatCard
          title="Participants"
          value={String(totalParticipants)}
          subtitle="Cumul des présences"
          icon={Users}
          tone="green"
        />

        <StatCard
          title="Nouveaux"
          value={String(totalNewPeople)}
          subtitle="Convertis + arrivants"
          icon={UserPlus}
          tone="gold"
        />

        <StatCard
          title="Serviteurs"
          value={String(totalServants)}
          subtitle="Présences serviteurs"
          icon={Clock}
          tone="purple"
        />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-black text-gray-950">
              {editingActivityId
                ? "Modifier le rapport d’activité"
                : "Nouveau rapport d’activité"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Cliquez pour encoder ou modifier une activité de votre cellule.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {editingActivityId ? (
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
              {editingActivityId ? "Formulaire ouvert" : "Ajouter un rapport"}
              {formOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {formOpen ? (
          <form onSubmit={handleSubmit} className="mt-6">
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
                label="Lieu"
                value={form.location}
                onChange={(value) => updateField("location", value)}
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
                type="number"
                value={form.men_count}
                onChange={(value) => updateField("men_count", value)}
              />

              <Input
                label="Femmes"
                type="number"
                value={form.women_count}
                onChange={(value) => updateField("women_count", value)}
              />

              <Input
                label="Enfants"
                type="number"
                value={form.children_count}
                onChange={(value) => updateField("children_count", value)}
              />

              <Input
                label="Serviteurs présents"
                type="number"
                value={form.servants_count}
                onChange={(value) => updateField("servants_count", value)}
              />

              <Input
                label="Nouveaux convertis"
                type="number"
                value={form.new_converts_count}
                onChange={(value) =>
                  updateField("new_converts_count", value)
                }
              />

              <Input
                label="Nouveaux arrivants"
                type="number"
                value={form.new_visitors_count}
                onChange={(value) =>
                  updateField("new_visitors_count", value)
                }
              />

              <Textarea
                label="Résumé"
                value={form.summary}
                onChange={(value) => updateField("summary", value)}
              />

              <Textarea
                label="Résultats / témoignages"
                value={form.results}
                onChange={(value) => updateField("results", value)}
              />

              <Textarea
                label="Besoins / recommandations"
                value={form.needs}
                onChange={(value) => updateField("needs", value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              <Save size={18} />
              {isLoading
                ? "Enregistrement..."
                : editingActivityId
                  ? "Modifier l’activité"
                  : "Enregistrer l’activité"}
            </button>
          </form>
        ) : null}
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-5">
          <h3 className="text-xl font-black text-gray-950">
            Dernières activités
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {activities.length} activité(s) affichée(s).
          </p>
        </div>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm font-semibold text-gray-500">
              Aucune activité enregistrée pour cette cellule.
            </div>
          ) : (
            activities.map((activity) => {
              const totalAttendance =
                Number(activity.total_attendance || 0) ||
                Number(activity.participants_count || 0);

              const newPeople =
                Number(activity.new_converts_count || 0) +
                Number(activity.new_visitors_count || 0);

              return (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-black text-gray-950">
                        {activity.activity_type} —{" "}
                        {activity.activity_date || "-"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {activity.activity_title || "Sans thème renseigné"}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-[var(--louange-gold-soft)] px-3 py-1 text-xs font-black text-[var(--louange-purple)]">
                      {totalAttendance} pers.
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    <p>
                      <strong>Intervenant :</strong>{" "}
                      {activity.speaker_name || "-"}
                    </p>

                    <p>
                      <strong>Horaire :</strong>{" "}
                      {activity.start_time || "--:--"} -{" "}
                      {activity.end_time || "--:--"}
                    </p>

                    <p>
                      <strong>Nouveaux :</strong> {newPeople}
                    </p>

                    <p>
                      <strong>Serviteurs :</strong>{" "}
                      {activity.servants_count || 0}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => editActivity(activity)}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--louange-purple)] px-4 py-2 text-sm font-black text-[var(--louange-purple)]"
                  >
                    <Pencil size={16} />
                    Modifier
                  </button>
                </div>
              );
            })
          )}
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
    <div className="md:col-span-2">
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