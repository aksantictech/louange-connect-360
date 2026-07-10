"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

type CellMapItem = {
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
};

type CellMapProps = {
  cells: CellMapItem[];
};

function getMarkerColor(status?: string | null) {
  if (status === "active") return "#16a34a";
  if (status === "pending") return "#f59e0b";
  if (status === "archived") return "#6b7280";
  return "#dc2626";
}

function createMarker(status?: string | null) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: ${getMarkerColor(status)};
        border: 3px solid white;
        box-shadow: 0 6px 18px rgba(0,0,0,.25);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function CellMap({ cells }: CellMapProps) {
  const validCells = cells.filter(
    (cell) => cell.latitude !== null && cell.longitude !== null
  );

  const center: [number, number] =
    validCells.length > 0
      ? [Number(validCells[0].latitude), Number(validCells[0].longitude)]
      : [0, 20];

  return (
    <div className="h-[620px] overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={validCells.length > 0 ? 4 : 2}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validCells.map((cell) => (
          <Marker
            key={cell.id}
            position={[Number(cell.latitude), Number(cell.longitude)]}
            icon={createMarker(cell.status)}
          >
            <Popup>
              <div className="min-w-[220px]">
                <p className="text-base font-black">{cell.name}</p>
                <p className="text-xs font-bold text-purple-700">{cell.code}</p>

                <div className="mt-2 text-sm">
                  <p>
                    <strong>Pays :</strong> {cell.country}
                  </p>
                  <p>
                    <strong>Ville :</strong> {cell.city || "-"}
                  </p>
                  <p>
                    <strong>Adresse :</strong> {cell.address || "-"}
                  </p>
                  <p>
                    <strong>Pasteur :</strong> {cell.pastor_name || "-"}
                  </p>
                  <p>
                    <strong>Téléphone :</strong> {cell.pastor_phone || "-"}
                  </p>
                  <p>
                    <strong>Statut :</strong> {cell.status || "-"}
                  </p>
                </div>

                <a
                  href={`/central/cells/${cell.id}`}
                  className="mt-3 inline-flex rounded-xl bg-purple-800 px-3 py-2 text-xs font-black text-white"
                >
                  Voir la cellule
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}