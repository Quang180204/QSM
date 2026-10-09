import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { LocateFixed, MapPin, Navigation } from "lucide-react";

export interface RealRouteMapProps {
  pickupCoords: [number, number]; // [lng, lat]
  destCoords: [number, number]; // [lng, lat]
  pickupName?: string;
  destName?: string;
  driverCoords?: [number, number]; // [lng, lat]
  isDarkMode?: boolean;
  progress?: number;
  onGpsLocate?: (coords: [number, number], label: string) => void;
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

export default function RealRouteMap({
  pickupCoords,
  destCoords,
  pickupName = "Điểm đón",
  destName = "Điểm đến",
  driverCoords,
  isDarkMode = true,
  progress = 0,
  onGpsLocate,
}: RealRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routePathRef = useRef<[number, number][]>([]);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [routeMeta, setRouteMeta] = useState<{
    distanceKm: string;
    durationMins: number;
  } | null>(null);

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
      html: `<div style="width:18px;height:18px;border-radius:50%;background:#00f5d4;border:3px solid #ffffff;box-shadow:0 0 16px #00f5d4;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const destIcon = L.divIcon({
      className: "qsm-map-pin-icon",
      html: `<div style="width:18px;height:18px;border-radius:50%;background:#10b981;border:3px solid #ffffff;box-shadow:0 0 16px #10b981;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    L.marker(pickupLatLng, { icon: pickupIcon })
      .bindPopup(`<strong>Điểm đón:</strong> ${pickupName}`)
      .addTo(map);

    L.marker(destLatLng, { icon: destIcon })
      .bindPopup(`<strong>Điểm đến:</strong> ${destName}`)
      .addTo(map);

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

