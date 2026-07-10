"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type PastorFormState = {
  full_name: string;
  pastor_role: string;
  phone: string;
  email: string;
  residence_country: string;
  residence_address: string;
  residence_city: string;
  marital_status: string;
  spouse_name: string;
  children_count: string;
  ordination_year: string;
  conversion_year: string;
};

const initialState: PastorFormState = {
  full_name: "",
  pastor_role: "pasteur_assistant",
  phone: "",
  email: "",
  residence_country: "",
  residence_address: "",
  residence_city: "",
  marital_status: "",
  spouse_name: "",
  children_count: "0",
  ordination_year: "",
  conversion_year: "",
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
const pastorRoles = [
  { value: "pasteur_visionnaire", label: "Pasteur Visionnaire" },
  { value: "pasteur_titulaire", label: "Pasteur Titulaire" },
  { value: "pasteur_assistant", label: "Pasteur Assistant" },
  { value: "berger", label: "Berger" },
];

const maritalStatuses = [
  "Célibataire",
  "Marié(e)",
  "Veuf / Veuve",
  "Divorcé(e)",
];

export default function PastorForm() {
  const router = useRouter();

  const [form, setForm] = useState<PastorFormState>(initialState);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(name: keyof PastorFormState, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
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

  function handlePhotoChange(file?: File) {
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto() {
    if (!photoFile) return null;

    const extension = photoFile.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("pastor-photos")
      .upload(fileName, photoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("pastor-photos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    if (!form.full_name.trim()) {
      setIsLoading(false);
      setErrorMessage("Le nom complet du pasteur est obligatoire.");
      return;
    }

    try {
      const photoUrl = await uploadPhoto();

      const payload = {
        full_name: form.full_name.trim(),
        pastor_role: form.pastor_role,
        phone: emptyToNull(form.phone),
        email: emptyToNull(form.email),
        residence_country: emptyToNull(form.residence_country),
        residence_address: emptyToNull(form.residence_address),
        residence_city: emptyToNull(form.residence_city),
        marital_status: emptyToNull(form.marital_status),
        spouse_name: emptyToNull(form.spouse_name),
        children_count: Number(form.children_count || 0),
        ordination_year: numberOrNull(form.ordination_year),
        conversion_year: numberOrNull(form.conversion_year),
        photo_url: photoUrl,
        status: "active",
      };

      const { error } = await supabase.from("pastors").insert(payload);

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      router.push("/central/pastors");
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
          Identification du pasteur / berger
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Ces informations permettront ensuite de rattacher les pasteurs aux cellules.
        </p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[220px_1fr]">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-center transition hover:border-[var(--louange-purple)]">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Aperçu pasteur"
              className="h-36 w-36 rounded-3xl object-cover"
            />
          ) : (
            <>
              <Upload size={40} className="text-[var(--louange-purple)]" />
              <span className="mt-3 text-sm font-black text-gray-900">
                Photo du pasteur
              </span>
              <span className="mt-1 text-xs text-gray-500">
                JPG, PNG, WEBP
              </span>
            </>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(event) => handlePhotoChange(event.target.files?.[0])}
            className="hidden"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nom complet"
            value={form.full_name}
            onChange={(value) => updateField("full_name", value)}
            placeholder="Nom complet"
            required
          />

          <Select
            label="Fonction"
            value={form.pastor_role}
            onChange={(value) => updateField("pastor_role", value)}
            options={pastorRoles}
            required
          />

          <Input
            label="Téléphone"
            value={form.phone}
            onChange={(value) => updateField("phone", value)}
            placeholder="+243..."
          />

          <Input
            label="Email"
            value={form.email}
            onChange={(value) => updateField("email", value)}
            placeholder="email@exemple.com"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Adresse de résidence"
          value={form.residence_address}
          onChange={(value) => updateField("residence_address", value)}
          placeholder="Adresse complète"
        />
<SelectText
  label="Pays de résidence"
  value={form.residence_country}
  onChange={(value) => updateField("residence_country", value)}
  options={countryOptions}
  placeholder="Sélectionner le pays"
/>
        <Input
          label="Ville de résidence"
          value={form.residence_city}
          onChange={(value) => updateField("residence_city", value)}
          placeholder="Kinshasa"
        />

        <SelectText
          label="État civil"
          value={form.marital_status}
          onChange={(value) => updateField("marital_status", value)}
          options={maritalStatuses}
          placeholder="Sélectionner"
        />

        <Input
          label="Nom de l’épouse / époux"
          value={form.spouse_name}
          onChange={(value) => updateField("spouse_name", value)}
          placeholder="Nom conjoint(e)"
        />

        <Input
          label="Nombre d’enfants"
          value={form.children_count}
          onChange={(value) => updateField("children_count", value)}
          placeholder="0"
        />

        <Input
          label="Année d’ordination"
          value={form.ordination_year}
          onChange={(value) => updateField("ordination_year", value)}
          placeholder="2020"
        />

        <Input
          label="Année de conversion"
          value={form.conversion_year}
          onChange={(value) => updateField("conversion_year", value)}
          placeholder="2005"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[var(--louange-purple-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} />
          {isLoading ? "Enregistrement..." : "Enregistrer le pasteur"}
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
        {required ? <span className="text-red-600"> *</span> : null}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--louange-purple)] focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SelectText({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--louange-purple)] focus:bg-white"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}