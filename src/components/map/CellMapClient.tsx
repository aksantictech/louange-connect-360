"use client";

import dynamic from "next/dynamic";

const CellMap = dynamic(() => import("@/components/map/CellMap"), {
  ssr: false,
});

type CellMapClientProps = {
  cells: Array<{
    id: string;
    code: string;
    name: string;
    country: string;
    city: string | null;
    address: string | null;
    pastor_name: string | null;
    pastor_phone: string | null;
    status: string | null;
    latitude: number | null;
    longitude: number | null;
  }>;
};

export default function CellMapClient({ cells }: CellMapClientProps) {
  return <CellMap cells={cells} />;
}