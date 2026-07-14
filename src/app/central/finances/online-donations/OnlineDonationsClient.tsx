"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Filter,
  HeartHandshake,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase/client";

type OnlineDonation = {
  id: string;
  donor_name: string | null;
  donor_phone: string | null;
  donor_email: string | null;
  donation_type: string | null;
  payment_method: string | null;
  provider: string | null;
  provider_reference: string | null;
  currency: string | null;
  amount: number | null;
  amount_cdf: number | null;
  amount_usd: number | null;
  status: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string | null;
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
  validated: "Validé",
  rejected: "Rejeté",
};

const typeLabels: Record<string, string> = {
  don: "Don",
  dime: "Dîme",
  offrande: "Offrande",
  action_de_grace: "Action de grâce",
};

export default function OnlineDonationsClient() {
  const [donations, setDonations] = useState<OnlineDonation[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDonations();
  }, []);

  async function loadDonations() {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("online_donations")
      .select(
        "id, donor_name, donor_phone, donor_email, donation_type, payment_method, provider, provider_reference, currency, amount, amount_cdf, amount_usd, status, notes, paid_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(300);

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setDonations((data || []) as OnlineDonation[]);
  }

  const filteredDonations = useMemo(() => {
    return donations.filter((donation) => {
      const statusOk = selectedStatus
        ? donation.status === selectedStatus
        : true;

      const typeOk = selectedType
        ? donation.donation_type === selectedType
        : true;

      const q = search.trim().toLowerCase();

      const searchOk = q
        ? [
            donation.donor_name,
            donation.donor_phone,
            donation.donor_email,
            donation.donation_type,
            donation.payment_method,
            donation.provider,
            donation.provider_reference,
            donation.status,
            donation.notes,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        : true;

      return statusOk && typeOk && searchOk;
    });
  }, [donations, selectedStatus, selectedType, search]);

  const validFinancialDonations = donations.filter((item) =>
    ["paid", "validated"].includes(item.status || "")
  );

  const totalUsd = validFinancialDonations.reduce(
    (sum, item) => sum + Number(item.amount_usd || 0),
    0
  );

  const totalCdf = validFinancialDonations.reduce(
    (sum, item) => sum + Number(item.amount_cdf || 0),
    0
  );

  const paidCount = donations.filter((item) => item.status === "paid").length;
  const validatedCount = donations.filter(
    (item) => item.status === "validated"
  ).length;
  const rejectedCount = donations.filter(
    (item) => item.status === "rejected"
  ).length;

  async function updateDonationStatus(
    donationId: string,
    status: "validated" | "rejected"
  ) {
    setMessage("");
    setErrorMessage("");

    const confirmed = window.confirm(
      status === "validated"
        ? "Confirmer la validation de ce don en ligne ?"
        : "Confirmer le rejet de ce don en ligne ?"
    );

    if (!confirmed) return;

    const { data: authData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("online_donations")
      .update({
        status,
        validated_by: authData.user?.id || null,
        validated_at: new Date().toISOString(),
      })
      .eq("id", donationId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      status === "validated"
        ? "Don validé avec succès."
        : "Don rejeté avec succès."
    );

    loadDonations();
  }

  return (
    <div>
      <PageHeader
        title="Dons en ligne"
        description="Suivi des dons provenant de la page publique de dons de l’église."
        action={
          <Link
            href="/central/finances"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 shadow-sm"
          >
            <ArrowLeft size={18} />
            Retour finance
          </Link>
        }
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Dons enregistrés"
          value={String(donations.length)}
          subtitle="Tous les dons en ligne"
          icon={HeartHandshake}
          tone="purple"
        />

        <StatCard
          title="Payés"
          value={String(paidCount)}
          subtitle="À contrôler"
          icon={HeartHandshake}
          tone="gold"
        />

        <StatCard
          title="Validés"
          value={String(validatedCount)}
          subtitle="Confirmés par finance"
          icon={CheckCircle2}
          tone="green"
        />

        <StatCard
          title="Total USD"
          value={`${totalUsd.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} USD`}
          subtitle="Payés + validés"
          icon={HeartHandshake}
          tone="green"
        />

        <StatCard
          title="Total CDF"
          value={`${totalCdf.toLocaleString("fr-FR")} FC`}
          subtitle={`${rejectedCount} rejeté(s)`}
          icon={HeartHandshake}
          tone="purple"
        />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-xl font-black text-gray-950">
              Liste des dons en ligne
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filteredDonations.length} don(s) affiché(s).
            </p>
          </div>

          <button
            type="button"
            onClick={loadDonations}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700"
          >
            <RefreshCw size={18} />
            {isLoading ? "Chargement..." : "Actualiser"}
          </button>
        </div>

        <div className="mb-5 flex items-center gap-2">
          <Filter size={18} className="text-[var(--louange-purple)]" />
          <h4 className="font-black text-gray-950">Filtres</h4>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <Select
            label="Statut"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: "", label: "Tous" },
              { value: "pending", label: "En attente" },
              { value: "paid", label: "Payé" },
              { value: "validated", label: "Validé" },
              { value: "rejected", label: "Rejeté" },
              { value: "failed", label: "Échoué" },
            ]}
          />

          <Select
            label="Type"
            value={selectedType}
            onChange={setSelectedType}
            options={[
              { value: "", label: "Tous" },
              { value: "don", label: "Don" },
              { value: "dime", label: "Dîme" },
              { value: "offrande", label: "Offrande" },
              { value: "action_de_grace", label: "Action de grâce" },
            ]}
          />

          <Input
            label="Recherche"
            value={search}
            onChange={setSearch}
            placeholder="Nom, téléphone, référence..."
          />
        </div>

        {filteredDonations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Search size={40} className="mx-auto text-[var(--louange-purple)]" />
            <p className="mt-3 text-sm font-bold text-gray-500">
              Aucun don en ligne trouvé pour le moment.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              L’import CSV sera ajouté plus tard. Pour la présentation, cette
              page montre déjà le futur espace de suivi des dons en ligne.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden rounded-2xl border border-gray-100 lg:block">
              <div className="max-w-full overflow-x-auto">
                <table className="min-w-[1100px] divide-y divide-gray-100">
                  <thead className="bg-[var(--louange-purple-dark)] text-white">
                    <tr>
                      <Th>Date</Th>
                      <Th>Donateur</Th>
                      <Th>Type</Th>
                      <Th>Méthode</Th>
                      <Th>Référence</Th>
                      <Th>Montant</Th>
                      <Th>Statut</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredDonations.map((donation) => (
                      <tr key={donation.id} className="hover:bg-gray-50">
                        <Td>{formatDate(donation.paid_at || donation.created_at)}</Td>

                        <Td>
                          <p className="font-black text-gray-950">
                            {donation.donor_name || "Anonyme"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {donation.donor_phone || donation.donor_email || "-"}
                          </p>
                        </Td>

                        <Td>
                          {typeLabels[donation.donation_type || ""] ||
                            donation.donation_type ||
                            "-"}
                        </Td>

                        <Td>{donation.payment_method || donation.provider || "-"}</Td>
                        <Td>{donation.provider_reference || "-"}</Td>

                        <Td>
                          <p className="font-black text-gray-950">
                            {Number(donation.amount || 0).toLocaleString("fr-FR")}{" "}
                            {donation.currency || "USD"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Number(donation.amount_cdf || 0).toLocaleString(
                              "fr-FR"
                            )}{" "}
                            FC
                          </p>
                        </Td>

                        <Td>
                          <StatusBadge status={donation.status} />
                        </Td>

                        <Td>
                          <DonationActions
                            status={donation.status}
                            onValidate={() =>
                              updateDonationStatus(donation.id, "validated")
                            }
                            onReject={() =>
                              updateDonationStatus(donation.id, "rejected")
                            }
                          />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {filteredDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-gray-950">
                        {donation.donor_name || "Anonyme"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(donation.paid_at || donation.created_at)}
                      </p>
                    </div>

                    <StatusBadge status={donation.status} />
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>Type :</strong>{" "}
                      {typeLabels[donation.donation_type || ""] ||
                        donation.donation_type ||
                        "-"}
                    </p>
                    <p>
                      <strong>Méthode :</strong>{" "}
                      {donation.payment_method || donation.provider || "-"}
                    </p>
                    <p>
                      <strong>Référence :</strong>{" "}
                      {donation.provider_reference || "-"}
                    </p>
                    <p>
                      <strong>Montant :</strong>{" "}
                      {Number(donation.amount || 0).toLocaleString("fr-FR")}{" "}
                      {donation.currency || "USD"}
                    </p>
                  </div>

                  <div className="mt-4">
                    <DonationActions
                      status={donation.status}
                      onValidate={() =>
                        updateDonationStatus(donation.id, "validated")
                      }
                      onReject={() =>
                        updateDonationStatus(donation.id, "rejected")
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR");
}

function StatusBadge({ status }: { status: string | null }) {
  const value = status || "pending";

  const styles: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    paid: "bg-blue-50 text-blue-700 ring-blue-200",
    validated: "bg-green-50 text-green-700 ring-green-200",
    rejected: "bg-red-50 text-red-700 ring-red-200",
    failed: "bg-red-50 text-red-700 ring-red-200",
    refunded: "bg-gray-100 text-gray-700 ring-gray-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${
        styles[value] || styles.pending
      }`}
    >
      {statusLabels[value] || value}
    </span>
  );
}

function DonationActions({
  status,
  onValidate,
  onReject,
}: {
  status: string | null;
  onValidate: () => void;
  onReject: () => void;
}) {
  if (status === "validated") {
    return (
      <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 ring-1 ring-green-200">
        Déjà validé
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-200">
        Rejeté
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onValidate}
        className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-sm font-black text-white"
      >
        <CheckCircle2 size={16} />
        Valider
      </button>

      <button
        type="button"
        onClick={onReject}
        className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-700 ring-1 ring-red-200"
      >
        <XCircle size={16} />
        Rejeter
      </button>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>

      <input
        value={value}
        placeholder={placeholder}
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
  options: Array<{ value: string; label: string }>;
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
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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