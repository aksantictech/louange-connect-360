"use client";

import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Upload, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type ImportedCell = {
  code: string;
  name: string;
  country: string;
  province?: string | null;
  city?: string | null;
  commune?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pastor_name?: string | null;
  pastor_phone?: string | null;
  secretary_name?: string | null;
  secretary_phone?: string | null;
  treasurer_name?: string | null;
  treasurer_phone?: string | null;
  main_service_day?: string | null;
  main_service_time?: string | null;
  status?: string | null;
};

const requiredColumns = ["code", "name", "country"];

function cleanText(value: unknown) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function cleanNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeStatus(value: unknown) {
  const status = String(value || "active").trim().toLowerCase();

  if (["active", "pending", "inactive", "archived"].includes(status)) {
    return status;
  }

  return "active";
}

export default function ImportCellsForm() {
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewRows, setPreviewRows] = useState<ImportedCell[]>([]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setErrorMessage("");
    setSuccessMessage("");
    setPreviewRows([]);

    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
    });

    if (rawRows.length === 0) {
      setErrorMessage("Le fichier Excel est vide.");
      return;
    }

    const firstRow = rawRows[0];
    const columns = Object.keys(firstRow);

    const missingColumns = requiredColumns.filter(
      (column) => !columns.includes(column)
    );

    if (missingColumns.length > 0) {
      setErrorMessage(
        `Colonnes obligatoires manquantes : ${missingColumns.join(", ")}`
      );
      return;
    }

    const cleanedRows: ImportedCell[] = rawRows
      .map((row) => ({
        code: String(row.code || "").trim().toUpperCase(),
        name: String(row.name || "").trim(),
        country: String(row.country || "").trim(),
        province: cleanText(row.province),
        city: cleanText(row.city),
        commune: cleanText(row.commune),
        address: cleanText(row.address),
        latitude: cleanNumber(row.latitude),
        longitude: cleanNumber(row.longitude),
        pastor_name: cleanText(row.pastor_name),
        pastor_phone: cleanText(row.pastor_phone),
        secretary_name: cleanText(row.secretary_name),
        secretary_phone: cleanText(row.secretary_phone),
        treasurer_name: cleanText(row.treasurer_name),
        treasurer_phone: cleanText(row.treasurer_phone),
        main_service_day: cleanText(row.main_service_day) || "Dimanche",
        main_service_time: cleanText(row.main_service_time),
        status: normalizeStatus(row.status),
      }))
      .filter((row) => row.code && row.name && row.country);

    if (cleanedRows.length === 0) {
      setErrorMessage(
        "Aucune ligne valide trouvée. Les colonnes code, name et country sont obligatoires."
      );
      return;
    }

    setPreviewRows(cleanedRows);
  }

  async function handleImport() {
    setErrorMessage("");
    setSuccessMessage("");

    if (previewRows.length === 0) {
      setErrorMessage("Aucune donnée prête à importer.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from("cells")
      .upsert(previewRows, { onConflict: "code" });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(`${previewRows.length} cellule(s) importée(s) avec succès.`);
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-[var(--louange-bg)] p-8 text-center transition hover:border-[var(--louange-purple)]">
          <Upload size={42} className="text-[var(--louange-purple)]" />
          <span className="mt-3 text-lg font-black text-gray-950">
            Sélectionner un fichier Excel
          </span>
          <span className="mt-1 text-sm text-gray-500">
            Format accepté : .xlsx
          </span>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6">
          <h3 className="text-lg font-black text-gray-950">
            Modèle Excel officiel
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Utilise ce modèle pour éviter les erreurs de colonnes. Ne modifie pas
            les noms des colonnes.
          </p>

          <Link
            href="/templates/modele_import_cellules_louange_connect_360.xlsx"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-gold)] px-5 py-3 text-sm font-black text-black shadow-sm"
          >
            <Download size={18} />
            Télécharger le modèle
          </Link>

          {fileName ? (
            <p className="mt-4 text-sm font-semibold text-[var(--louange-purple)]">
              Fichier sélectionné : {fileName}
            </p>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <AlertTriangle size={20} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {previewRows.length > 0 ? (
        <>
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-black text-gray-950">
                Aperçu avant importation
              </h3>
              <p className="text-sm text-gray-500">
                {previewRows.length} ligne(s) valide(s) détectée(s).
              </p>
            </div>

            <button
              type="button"
              onClick={handleImport}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[var(--louange-purple-dark)] disabled:opacity-60"
            >
              <Upload size={18} />
              {isLoading ? "Importation..." : "Importer dans Supabase"}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <div className="max-h-[420px] overflow-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="sticky top-0 bg-[var(--louange-purple-dark)] text-white">
                  <tr>
                    <Th>Code</Th>
                    <Th>Cellule</Th>
                    <Th>Pays</Th>
                    <Th>Ville</Th>
                    <Th>Pasteur</Th>
                    <Th>Statut</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {previewRows.slice(0, 100).map((row) => (
                    <tr key={row.code} className="hover:bg-gray-50">
                      <Td>{row.code}</Td>
                      <Td>{row.name}</Td>
                      <Td>{row.country}</Td>
                      <Td>{row.city || "-"}</Td>
                      <Td>{row.pastor_name || "-"}</Td>
                      <Td>{row.status || "active"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {previewRows.length > 100 ? (
            <p className="mt-3 text-sm text-gray-500">
              Seules les 100 premières lignes sont affichées dans l’aperçu.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-black uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700">
      {children}
    </td>
  );
}