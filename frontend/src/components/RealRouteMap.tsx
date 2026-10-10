import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { LocateFixed, MapPin, Navigation } from "lucide-react";
import { locationDirectory, type Place } from "../data/catalog";

export interface RealRouteMapProps {
  pickupCoords: [number, number]; // [lng, lat]
  destCoords: [number, number]; // [lng, lat]
  pickupName?: string;
  destName?: string;
  driverCoords?: [number, number]; // [lng, lat]
  isDarkMode?: boolean;
  progress?: number;
  interactivePick?: boolean;
  onGpsLocate?: (coords: [number, number], label: string) => void;
  onMapSelectPlace?: (
    target: "pickup" | "destination",
    place: Place,
  ) => void;
}

export async function fetchRealRoute(
  pickup: [number, number],
  dest: [number, number],
): Promise<{
  coordinates: [number, number][]; // [lat, lng] array for Leaflet polyline
  distanceKm: string;
  durationMins: number;
} | null> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${pickup[0]},${pickup[1]};${dest[0]},${dest[1]}?overview=full&geometries=geojson`,
    );
    if (!response.ok) return null;
    const json = (await response.json()) as {
      routes?: Array<{
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
      }>;
    };
    const routeData = json.routes?.[0];
    if (!routeData) return null;

    const coordinates: [number, number][] =
      routeData.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const distanceKm = (routeData.distance / 1000).toFixed(1);
    const durationMins = Math.max(3, Math.round(routeData.duration / 60));

    return { coordinates, distanceKm, durationMins };
  } catch {
    return null;
  }
}

async function resolveCoordsToPlace(
  lng: number,
  lat: number,
  target: "pickup" | "destination",
): Promise<Place> {
  // Kiểm tra xem có gần địa điểm quen thuộc nào trong bán kính ~450m không
  for (const item of locationDirectory) {
    const dLng = Math.abs(item.coords[0] - lng);
    const dLat = Math.abs(item.coords[1] - lat);
    if (dLng < 0.004 && dLat < 0.004) {
      return item;
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi`,
    );
    if (res.ok) {
      const data = (await res.json()) as {
        name?: string;
        display_name?: string;
        address?: {
          road?: string;
          suburb?: string;
          city_district?: string;
          city?: string;
        };
      };
      const road =
        data.name ||
        data.address?.road ||
        data.address?.suburb ||
        (target === "pickup" ? "Điểm đón trên bản đồ" : "Điểm đến trên bản đồ");
      const shortAddr =
        data.display_name?.split(",").slice(0, 3).join(",").trim() ||
        `Tọa độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      return {
        name: road,
        address: shortAddr,
        coords: [Number(lng.toFixed(5)), Number(lat.toFixed(5))],
      };
    }
  } catch {
    // Fallback
  }

  return {
    name:
      target === "pickup"
        ? `Điểm đón (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        : `Điểm đến (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    address: `Tọa độ GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    coords: [Number(lng.toFixed(5)), Number(lat.toFixed(5))],
  };
}

export default function RealRouteMap({
  pickupCoords,
  destCoords,
  pickupName = "Điểm đón",
  destName = "Điểm đến",
  driverCoords,
  isDarkMode = true,
  progress = 0,
  interactivePick = false,
  onGpsLocate,
  onMapSelectPlace,
}: RealRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routePathRef = useRef<[number, number][]>([]);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [pinTarget, setPinTarget] = useState<"pickup" | "destination">("pickup");
  const pinTargetRef = useRef<"pickup" | "destination">("pickup");
  const onMapSelectRef = useRef(onMapSelectPlace);

  const [routeMeta, setRouteMeta] = useState<{
    distanceKm: string;
    durationMins: number;
  } | null>(null);

  useEffect(() => {
    pinTargetRef.current = pinTarget;
  }, [pinTarget]);

  useEffect(() => {
    onMapSelectRef.current = onMapSelectPlace;
  }, [onMapSelectPlace]);

  const pickupLng = pickupCoords[0];
  const pickupLat = pickupCoords[1];
  const destLng = destCoords[0];
  const destLat = destCoords[1];
  const driverLng = driverCoords?.[0];
  const driverLat = driverCoords?.[1];

  useEffect(() => {
    if (!mapContainer.current) return;

    const pickupLatLng: [number, number] = [pickupLat, pickupLng];
    const destLatLng: [number, number] = [destLat, destLng];

    const map = L.map(mapContainer.current, {
      center: pickupLatLng,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });
    mapRef.current = map;

    const tileUrl = isDarkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    const pickupIcon = L.divIcon({
      className: "qsm-map-pin-icon",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#00f5d4;border:3px solid #ffffff;box-shadow:0 0 16px #00f5d4;cursor:grab;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const destIcon = L.divIcon({
      className: "qsm-map-pin-icon",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#10b981;border:3px solid #ffffff;box-shadow:0 0 16px #10b981;cursor:grab;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const pMarker = L.marker(pickupLatLng, {
      icon: pickupIcon,
      draggable: interactivePick,
    })
      .bindPopup(`<strong>Điểm đón:</strong> ${pickupName}`)
      .addTo(map);

    const dMarker = L.marker(destLatLng, {
      icon: destIcon,
      draggable: interactivePick,
    })
      .bindPopup(`<strong>Điểm đến:</strong> ${destName}`)
      .addTo(map);

    if (interactivePick) {
      pMarker.on("dragend", () => {
        const pos = pMarker.getLatLng();
        void resolveCoordsToPlace(pos.lng, pos.lat, "pickup").then((place) => {
          onMapSelectRef.current?.("pickup", place);
        });
      });

      dMarker.on("dragend", () => {
        const pos = dMarker.getLatLng();
        void resolveCoordsToPlace(pos.lng, pos.lat, "destination").then(
          (place) => {
            onMapSelectRef.current?.("destination", place);
          },
        );
      });

      map.on("click", (ev: L.LeafletMouseEvent) => {
        const target = pinTargetRef.current;
        void resolveCoordsToPlace(ev.latlng.lng, ev.latlng.lat, target).then(
          (place) => {
            onMapSelectRef.current?.(target, place);
          },
        );
      });
    }

    // Vẽ đường cơ sở ngay lập tức
    const baseLine = L.polyline([pickupLatLng, destLatLng], {
      color: "#00f5d4",
      weight: 4,
      opacity: 0.85,
      dashArray: "6 6",
    }).addTo(map);

    map.fitBounds(L.latLngBounds([pickupLatLng, destLatLng]), {
      padding: [42, 42],
    });

    // Tải lộ trình thực tế qua OSRM Directions API
    let active = true;
    void fetchRealRoute([pickupLng, pickupLat], [destLng, destLat]).then((res) => {
      if (!active || !res || !mapRef.current) return;
      baseLine.remove();
      routePathRef.current = res.coordinates;
      setRouteMeta({
        distanceKm: res.distanceKm,
        durationMins: res.durationMins,
      });
      const realPoly = L.polyline(res.coordinates, {
        color: "#00f5d4",
        weight: 5,
        opacity: 0.95,
      }).addTo(mapRef.current);
      mapRef.current.fitBounds(realPoly.getBounds(), { padding: [38, 38] });
    });

    // Khởi tạo marker xe điện QSM
    const initialCarLatLng: [number, number] =
      driverLat !== undefined && driverLng !== undefined
        ? [driverLat, driverLng]
        : pickupLatLng;

    const carIcon = L.divIcon({
      className: "qsm-map-car-icon",
      html: `<div style="width:30px;height:30px;border-radius:50%;background:#051923;border:2px solid #00f5d4;display:flex;align-items:center;justify-content:center;color:#00f5d4;box-shadow:0 0 16px rgba(0,245,212,0.75);font-size:14px;">⚡</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    driverMarkerRef.current = L.marker(initialCarLatLng, { icon: carIcon })
      .bindPopup("Xe điện QSM đang hoạt động")
      .addTo(map);

    return () => {
      active = false;
      map.remove();
      mapRef.current = null;
    };
  }, [
    pickupLng,
    pickupLat,
    destLng,
    destLat,
    driverLng,
    driverLat,
    pickupName,
    destName,
    isDarkMode,
    interactivePick,
  ]);

  // Cập nhật vị trí xe theo tiến độ hành trình
  useEffect(() => {
    if (!driverMarkerRef.current) return;
    const pts = routePathRef.current;
    if (pts.length > 1 && progress > 0) {
      const idx = Math.min(
        pts.length - 1,
        Math.floor(progress * (pts.length - 1)),
      );
      driverMarkerRef.current.setLatLng(pts[idx]);
    } else if (driverCoords) {
      driverMarkerRef.current.setLatLng([driverCoords[1], driverCoords[0]]);
    } else {
      const lat =
        pickupCoords[1] + (destCoords[1] - pickupCoords[1]) * progress;
      const lng =
        pickupCoords[0] + (destCoords[0] - pickupCoords[0]) * progress;
      driverMarkerRef.current.setLatLng([lat, lng]);
    }
  }, [progress, driverCoords, pickupCoords, destCoords]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const userLng = Number(pos.coords.longitude.toFixed(5));
        const userLat = Number(pos.coords.latitude.toFixed(5));
        mapRef.current?.flyTo([userLat, userLng], 15, { duration: 1.1 });
        onGpsLocate?.([userLng, userLat], "Vị trí GPS của bạn");
      },
      () => {
        setLocating(false);
        mapRef.current?.flyTo([pickupCoords[1], pickupCoords[0]], 14);
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  return (
    <div
      className="real-map-wrapper"
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <div
        ref={mapContainer}
        className="real-map-container"
        style={{ width: "100%", height: "100%", minHeight: "260px" }}
      />
      <span className="map-label pickup" style={{ zIndex: 500 }}>
        <Navigation size={13} />
        {pickupName}
      </span>
      <span className="map-label destination" style={{ zIndex: 500 }}>
        <MapPin size={13} />
        {destName}
      </span>

      {/* Chế độ chạm bản đồ chọn nhanh Điểm đón / Điểm đến */}
      {interactivePick && (
        <div className="map-pin-mode-switcher" style={{ zIndex: 500 }}>
          <span>Chạm bản đồ chọn:</span>
          <button
            type="button"
            className={pinTarget === "pickup" ? "active pickup" : ""}
            onClick={() => setPinTarget("pickup")}
          >
            ● Điểm đón
          </button>
          <button
            type="button"
            className={pinTarget === "destination" ? "active dest" : ""}
            onClick={() => setPinTarget("destination")}
          >
            ● Điểm đến
          </button>
        </div>
      )}

      <span className="map-watermark" style={{ zIndex: 500 }}>
        {routeMeta
          ? `QSM GPS · ${routeMeta.distanceKm} km (~${routeMeta.durationMins} phút)`
          : "Bản đồ số QSM GPS"}
      </span>
      <button
        type="button"
        className="map-locate"
        style={{ zIndex: 500, cursor: "pointer", border: "none" }}
        title="Định vị GPS thiết bị của tôi"
        onClick={handleLocateMe}
      >
        <LocateFixed size={18} className={locating ? "spin-slow" : ""} />
      </button>
    </div>
  );
}
