"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

interface AisVesselMapProps {
  lat: number;
  lng: number;
  vesselName?: string | null;
  sog?: number | null;
  course?: number | null;
  className?: string;
}

export default function AisVesselMap({
  lat,
  lng,
  vesselName,
  sog,
  course,
  className,
}: AisVesselMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const leaflet = await import("leaflet");
      // Load Leaflet CSS from CDN once (avoids bundler CSS type issues).
      if (typeof window !== "undefined" && !document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = leaflet.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([lat, lng], 6);

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(map);

      const icon = leaflet.divIcon({
        className: "",
        html: `<div style="
          width:18px;height:18px;border-radius:50%;
          background:#0ea5e9;border:3px solid #fff;
          box-shadow:0 1px 4px rgba(0,0,0,.45);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const popupLines = [
        vesselName ? `<strong>${vesselName}</strong>` : "Vessel position",
        `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
        sog != null ? `Speed: ${sog.toFixed(1)} kn` : null,
        course != null ? `Course: ${course.toFixed(0)}°` : null,
      ].filter(Boolean);

      leaflet
        .marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(popupLines.join("<br/>"))
        .openPopup();

      if (course != null && course >= 0 && course <= 360) {
        const rad = ((course - 90) * Math.PI) / 180;
        const len = 0.35;
        leaflet
          .polyline(
            [
              [lat, lng],
              [lat + len * Math.sin(rad), lng + len * Math.cos(rad)],
            ],
            { color: "#0ea5e9", weight: 2, opacity: 0.85 }
          )
          .addTo(map);
      }

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng, vesselName, sog, course]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-72 w-full rounded-md border overflow-hidden z-0"}
      role="img"
      aria-label={vesselName ? `Map of ${vesselName}` : "Vessel AIS position map"}
    />
  );
}
