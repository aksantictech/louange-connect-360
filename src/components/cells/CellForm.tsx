"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type PastorRole =
  | "pasteur_visionnaire"
  | "pasteur_titulaire"
  | "pasteur_assistant"
  | "berger";

type Pastor = {
  id: string;
  full_name: string;
  pastor_role: PastorRole;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  status: string | null;
};

type MinisterRole = "pasteur_assistant" | "berger";

type MinisterInput = {
  pastor_id: string;
  minister_role: MinisterRole;
};

type FormState = {
  code: string;
  name: string;
  country: string;
  province: string;
  city: string;
  commune: string;
  address: string;
  latitude: string;
  longitude: string;
  lead_pastor_id: string;
  secretary_name: string;
  secretary_phone: string;
  treasurer_name: string;
  treasurer_phone: string;
  main_service_day: string;
  main_service_time: string;
  status: string;
};

const initialState: FormState = {
  code: "",
  name: "",
  country: "",
  province: "",
  city: "",
  commune: "",
  address: "",
  latitude: "",
  longitude: "",
  lead_pastor_id: "",
  secretary_name: "",
  secretary_phone: "",
  treasurer_name: "",
  treasurer_phone: "",
  main_service_day: "Dimanche",
  main_service_time: "",
  status: "active",
};

const countryOptions = [
  "RDC",
  "Congo-Brazzaville",
  "Angola",
  "Afrique du Sud",
  "Belgique",
  "France",
  "Allemagne",
  "Suisse",
  "États-Unis",
  "Canada",
  "Brésil",
  "Royaume-Uni",
  "Italie",
  "Espagne",
  "Portugal",
  "Autre",
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "pending", label: "En création" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archivée" },
];

const pastorRoleLabels: Record<PastorRole, string> = {
  pasteur_visionnaire: "Pasteur Visionnaire",
  pasteur_titulaire: "Pasteur Titulaire",
  pasteur_assistant: "Pasteur Assistant",
  berger: "Berger",
};

export default function CellForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialState);
  const [pastors, setPastors] = useState<Pastor[]>([]);

  const [ministers, setMinisters] = useState<MinisterInput[]>([
    {
      pastor_id: "",
      minister_role: "pasteur_assistant",
    },
  ]);

  const [cellPhotoFile, setCellPhotoFile] = useState<File | null>(null);
  const [cellPhotoPreview, setCellPhotoPreview] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPastors, setIsLoadingPastors] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPastors() {
      setIsLoadingPastors(true);

      const { data, error } = await supabase
        .from("pastors")
        .select("id, full_name, pastor_role, phone, email, photo_url, status")
        .eq("status", "active")
        .order("full_name", { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        setIsLoadingPastors(false);
        return;
      }

      setPastors((data || []) as Pastor[]);
      setIsLoadingPastors(false);
    }

    loadPastors();
  }, []);

  const selectedLeadPastor = pastors.find(
    (pastor) => pastor.id === form.lead_pastor_id
  );

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateMinister(
    index: number,
    field: keyof MinisterInput,
    value: string
  ) {
    setMinisters((current) =>
      current.map((minister, currentIndex) =>
        currentIndex === index
          ? {
              ...minister,
              [field]: value,
            }
          : minister
      )
    );
  }

  function addMinister(role: MinisterRole) {
    setMinisters((current) => [
      ...current,
      {
        pastor_id: "",
        minister_role: role,
      },
    ]);
  }

  function removeMinister(index: number) {
    setMinisters((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  function emptyToNull(value: string) {
    const cleaned = value.trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  function stringToNumberOrNull(value: string) {
    const cleaned = value.trim();

    if (!cleaned) {
      return null;
    }

    const numberValue = Number(cleaned);

    if (!Number.isFinite(numberValue)) {
      return null;
    }

    return numberValue;
  }

  function handleCellPhotoChange(file?: File) {
    if (!file) return;

    setCellPhotoFile(file);
    setCellPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadCellPhoto() {
    if (!cellPhotoFile) return null;

    const extension = cellPhotoFile.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("cell-photos")
      .upload(fileName, cellPhotoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("cell-photos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    if (!form.code.trim() || !form.name.trim() || !form.country.trim()) {
      setIsLoading(false);
      setErrorMessage(
        "Le code, le nom de la cellule et le pays sont obligatoires."
      );
      return;
    }

    if (!form.lead_pastor_id) {
      setIsLoading(false);
      setErrorMessage(
        "Sélectionne le pasteur responsable principal de la cellule."
      );
      return;
    }

    try {
      const photoUrl = await uploadCellPhoto();

      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        country: form.country.trim(),
        province: emptyToNull(form.province),
        city: emptyToNull(form.city),
        commune: emptyToNull(form.commune),
        address: emptyToNull(form.address),
        latitude: stringToNumberOrNull(form.latitude),
        longitude: stringToNumberOrNull(form.longitude),

        lead_pastor_id: form.lead_pastor_id,

        // Ces deux champs restent utiles pour l'affichage rapide dans la liste des cellules.
        pastor_name: selectedLeadPastor?.full_name || null,
        pastor_phone: selectedLeadPastor?.phone || null,

        secretary_name: emptyToNull(form.secretary_name),
        secretary_phone: emptyToNull(form.secretary_phone),
        treasurer_name: emptyToNull(form.treasurer_name),
        treasurer_phone: emptyToNull(form.treasurer_phone),
        main_service_day: emptyToNull(form.main_service_day),
        main_service_time: emptyToNull(form.main_service_time),
        photo_url: photoUrl,
        status: form.status,
      };

      const { data: createdCell, error } = await supabase
        .from("cells")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        setIsLoading(false);
        setErrorMessage(error.message);
        return;
      }

      if (!createdCell?.id) {
        setIsLoading(false);
        setErrorMessage(
          "La cellule a été créée, mais son identifiant est introuvable."
        );
        return;
      }

      const validMinisters = ministers
        .filter((minister) => minister.pastor_id.trim().length > 0)
        .map((minister, index) => {
          const selectedPastor = pastors.find(
            (pastor) => pastor.id === minister.pastor_id
          );

          return {
            cell_id: createdCell.id,
            pastor_id: minister.pastor_id,
            full_name: selectedPastor?.full_name || "Responsable non identifié",
            phone: selectedPastor?.phone || null,
            minister_role: minister.minister_role,
            sort_order: index + 1,
            status: "active",
          };
        });

      if (validMinisters.length > 0) {
        const { error: ministersError } = await supabase
          .from("cell_ministers")
          .insert(validMinisters);

        if (ministersError) {
          setIsLoading(false);
          setErrorMessage(
            `La cellule a été créée, mais les pasteurs assistants/bergers n'ont pas été enregistrés : ${ministersError.message}`
          );
          return;
        }
      }

      setIsLoading(false);
      router.push("/central/cells");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l’enregistrement."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
    >
      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mb-6 rounded-3xl border border-[var(--louange-gold)] bg-[var(--louange-bg)] p-5">
        <h3 className="text-lg font-black text-gray-950">
          Informations générales de la cellule
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Renseignez l’identité, la localisation, la photo et les responsables
          principaux de la cellule.
        </p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[220px_1fr]">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-center transition hover:border-[var(--louange-purple)]">
          {cellPhotoPreview ? (
            <img
              src={cellPhotoPreview}
              alt="Aperçu cellule"
              className="h-36 w-36 rounded-3xl object-cover"
            />
          ) : (
            <>
              <Camera size={40} className="text-[var(--louange-purple)]" />
              <span className="mt-3 text-sm font-black text-gray-900">
                Photo de la cellule
              </span>
              <span className="mt-1 text-xs text-gray-500">
                Temple, lieu de culte ou groupe
              </span>
            </>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(event) => handleCellPhotoChange(event.target.files?.[0])}
            className="hidden"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Code cellule"
            value={form.code}
            onChange={(value) => updateField("code", value)}
            placeholder="LL-KIN-001"
            required
          />

          <Input
            label="Nom de la cellule"
            value={form.name}
            onChange={(value) => updateField("name", value)}
            placeholder="La Louange Kinshasa Centre"
            required
          />

          <Select
            label="Pays"
            value={form.country}
            onChange={(value) => updateField("country", value)}
            options={countryOptions}
            placeholder="Sélectionner un pays"
            required
          />

          <Input
            label="Province / Région"
            value={form.province}
            onChange={(value) => updateField("province", value)}
            placeholder="Kinshasa"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Ville"
          value={form.city}
          onChange={(value) => updateField("city", value)}
          placeholder="Kinshasa"
        />

        <Input
          label="Commune / Quartier"
          value={form.commune}
          onChange={(value) => updateField("commune", value)}
          placeholder="Gombe"
        />

        <div className="md:col-span-2">
          <Input
            label="Adresse complète"
            value={form.address}
            onChange={(value) => updateField("address", value)}
            placeholder="Adresse complète de la cellule"
          />
        </div>

        <Input
          label="Latitude"
          value={form.latitude}
          onChange={(value) => updateField("latitude", value)}
          placeholder="-4.325"
        />

        <Input
          label="Longitude"
          value={form.longitude}
          onChange={(value) => updateField("longitude", value)}
          placeholder="15.322"
        />

        <PastorSearchSelect
          label="Pasteur responsable principal"
          value={form.lead_pastor_id}
          onChange={(value) => updateField("lead_pastor_id", value)}
          pastors={pastors}
          roleFilters={[
            "pasteur_titulaire",
            "pasteur_visionnaire",
            "pasteur_assistant",
          ]}
          isLoading={isLoadingPastors}
          required
        />

        <PastorInfoCard pastor={selectedLeadPastor} />

        <Input
          label="Secrétaire"
          value={form.secretary_name}
          onChange={(value) => updateField("secretary_name", value)}
          placeholder="Nom du secrétaire"
        />

        <Input
          label="Téléphone secrétaire"
          value={form.secretary_phone}
          onChange={(value) => updateField("secretary_phone", value)}
          placeholder="+243..."
        />

        <Input
          label="Trésorier"
          value={form.treasurer_name}
          onChange={(value) => updateField("treasurer_name", value)}
          placeholder="Nom du trésorier"
        />

        <Input
          label="Téléphone trésorier"
          value={form.treasurer_phone}
          onChange={(value) => updateField("treasurer_phone", value)}
          placeholder="+243..."
        />

        <Input
          label="Jour principal de culte"
          value={form.main_service_day}
          onChange={(value) => updateField("main_service_day", value)}
          placeholder="Dimanche"
        />

        <Input
          label="Heure du culte"
          value={form.main_service_time}
          onChange={(value) => updateField("main_service_time", value)}
          placeholder="09:00"
        />

        <Select
          label="Statut"
          value={form.status}
          onChange={(value) => updateField("status", value)}
          options={statusOptions.map((status) => status.value)}
          labels={statusOptions}
          placeholder="Sélectionner un statut"
          required
        />
      </div>

      <div className="mt-8 rounded-3xl border border-gray-100 bg-gray-50 p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-black text-gray-950">
              Pasteurs assistants & Bergers
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Sélectionnez les autres pasteurs et bergers depuis la table des
              pasteurs.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => addMinister("pasteur_assistant")}
              className="rounded-2xl bg-[var(--louange-purple)] px-4 py-2 text-sm font-black text-white transition hover:bg-[var(--louange-purple-dark)]"
            >
              + Pasteur assistant
            </button>

            <button
              type="button"
              onClick={() => addMinister("berger")}
              className="rounded-2xl bg-[var(--louange-gold)] px-4 py-2 text-sm font-black text-black transition hover:bg-[var(--louange-gold-dark)]"
            >
              + Berger
            </button>
          </div>
        </div>

        {ministers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm font-semibold text-gray-500">
            Aucun pasteur assistant ou berger ajouté pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            {ministers.map((minister, index) => (
              <div
                key={`${minister.minister_role}-${index}`}
                className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-[220px_1fr_auto]"
              >
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Fonction
                  </label>

                  <select
                    value={minister.minister_role}
                    onChange={(event) =>
                      updateMinister(
                        index,
                        "minister_role",
                        event.target.value as MinisterRole
                      )
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--louange-purple)] focus:bg-white"
                  >
                    <option value="pasteur_assistant">
                      Pasteur assistant
                    </option>
                    <option value="berger">Berger</option>
                  </select>
                </div>

                <PastorSearchSelect
                  label={
                    minister.minister_role === "berger"
                      ? "Berger"
                      : "Pasteur assistant"
                  }
                  value={minister.pastor_id}
                  onChange={(value) => updateMinister(index, "pastor_id", value)}
                  pastors={pastors}
                  roleFilters={[minister.minister_role]}
                  isLoading={isLoadingPastors}
                />

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeMinister(index)}
                    className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[var(--louange-purple-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} />
          {isLoading ? "Enregistrement..." : "Enregistrer la cellule"}
        </button>
      </div>
    </form>
  );
}

function PastorInfoCard({ pastor }: { pastor?: Pastor }) {
  if (!pastor) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm font-semibold text-gray-500">
        Aucun pasteur responsable sélectionné.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-sm font-black text-gray-950">
        {pastor.full_name}
      </p>
      <p className="mt-1 text-xs font-semibold text-[var(--louange-purple)]">
        {pastorRoleLabels[pastor.pastor_role]}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {pastor.phone || "Téléphone non renseigné"}
      </p>
    </div>
  );
}

function PastorSearchSelect({
  label,
  value,
  onChange,
  pastors,
  roleFilters,
  isLoading,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  pastors: Pastor[];
  roleFilters: PastorRole[];
  isLoading: boolean;
  required?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filteredPastors = pastors.filter((pastor) => {
    const matchesRole = roleFilters.includes(pastor.pastor_role);
    const matchesSearch = pastor.full_name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesRole && matchesSearch;
  });

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher un pasteur..."
        className="mb-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-[var(--louange-purple)]"
      />

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={isLoading}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--louange-purple)] focus:bg-white disabled:opacity-60"
      >
        <option value="">
          {isLoading ? "Chargement des pasteurs..." : "Sélectionner"}
        </option>

        {filteredPastors.map((pastor) => (
          <option key={pastor.id} value={pastor.id}>
            {pastor.full_name} — {pastorRoleLabels[pastor.pastor_role]}
          </option>
        ))}
      </select>

      {!isLoading && filteredPastors.length === 0 ? (
        <p className="mt-2 text-xs font-semibold text-red-600">
          Aucun pasteur trouvé pour cette fonction.
        </p>
      ) : null}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--louange-purple)] focus:bg-white"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels,
  placeholder = "Sélectionner",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
}) {
  function getLabel(option: string) {
    return labels?.find((item) => item.value === option)?.label ?? option;
  }

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
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--louange-purple)] focus:bg-white"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}