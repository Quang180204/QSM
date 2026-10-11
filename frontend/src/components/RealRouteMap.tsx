import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, MapPin, Navigation } from "lucide-react";
import { locationDirectory, type Place } from "../data/catalog";

export interface RealRouteMapProps {
  pickupCoords: [number, number]; // [lng, lat]
  destCoords: [number, number]; // [lng, lat]
  stops?: Place[];
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

const EMPTY_STOPS: Place[] = [];

interface CachedRouteData {
  coordinates: [number, number][]; // [lat, lng] array for Leaflet polyline
  distanceKm: string;
  durationMins: number;
}

const routeCache = new Map<string, CachedRouteData>();

export function computeBearing(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(startLat);
  const φ2 = toRad(endLat);
  const Δλ = toRad(endLng - startLng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

function buildFallbackInterpolatedRoute(
  allWaypoints: [number, number][], // [lng, lat][]
): CachedRouteData {
  const coordsLatLng: [number, number][] = [];
  let totalDistKm = 0;

  for (let i = 0; i < allWaypoints.length - 1; i++) {
    const [lng1, lat1] = allWaypoints[i];
    const [lng2, lat2] = allWaypoints[i + 1];

    // Haversine approximation
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistKm += 6371 * c * 1.25;

    const steps = 24;
    for (let s = 0; s <= steps; s++) {
      if (i > 0 && s === 0) continue;
      const t = s / steps;
      // Slight curve offset for visual realism when offline
      const curveOffset = Math.sin(t * Math.PI) * 0.0012;
      const lat = lat1 + (lat2 - lat1) * t + curveOffset;
      const lng = lng1 + (lng2 - lng1) * t - curveOffset;
      coordsLatLng.push([lat, lng]);
    }
  }

  const distFixed = Math.max(1.2, totalDistKm).toFixed(1);
  const durationMins = Math.max(4, Math.round(Number(distFixed) * 2.2));
  return {
    coordinates: coordsLatLng,
    distanceKm: distFixed,
    durationMins,
  };
}

export async function fetchRealRoute(
  pickup: [number, number],
  dest: [number, number],
  stops?: Place[],
): Promise<CachedRouteData | null> {
  const stopCoords = (stops || []).map((s) => s.coords);
  const allWaypoints: [number, number][] = [pickup, ...stopCoords, dest];
  const waypointsStr = allWaypoints
    .map(([lng, lat]) => `${Number(lng).toFixed(5)},${Number(lat).toFixed(5)}`)
    .join(";");

  const cached = routeCache.get(waypointsStr);
  if (cached) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson`,
      { signal: controller.signal },
    );
    clearTimeout(timer);

    if (response.ok) {
      const json = (await response.json()) as {
        routes?: Array<{
          distance: number;
          duration: number;
          geometry: { coordinates: [number, number][] };
        }>;
      };
      const routeData = json.routes?.[0];
      if (routeData && routeData.geometry.coordinates.length > 1) {
        const coordinates: [number, number][] =
          routeData.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const distanceKm = (routeData.distance / 1000).toFixed(1);
        const durationMins = Math.max(3, Math.round(routeData.duration / 60));
        const result: CachedRouteData = {
          coordinates,
          distanceKm,
          durationMins,
        };
        routeCache.set(waypointsStr, result);
        return result;
      }
    }
  } catch {
    // Fallback to interpolated route below
  }

  const fallback = buildFallbackInterpolatedRoute(allWaypoints);
  routeCache.set(waypointsStr, fallback);
  return fallback;
}

async function resolveCoordsToPlace(
  lng: number,
  lat: number,
  target: "pickup" | "destination",
): Promise<Place> {
  for (const item of locationDirectory) {
    const dLng = Math.abs(item.coords[0] - lng);
    const dLat = Math.abs(item.coords[1] - lat);
    if (dLng < 0.004 && dLat < 0.004) {
      return item;
    }
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
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

// OSM Standard: free, no API key, very reliable worldwide
const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors';

export default function RealRouteMap({
  pickupCoords,
  destCoords,
  stops = EMPTY_STOPS,
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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routePathRef = useRef<[number, number][]>([]);
  const lastFittedRouteKeyRef = useRef<string>("");

  const [locating, setLocating] = useState(false);
  const [pinTarget, setPinTarget] = useState<"pickup" | "destination">("pickup");
  const pinTargetRef = useRef<"pickup" | "destination">("pickup");
  const interactivePickRef = useRef<boolean>(interactivePick);
  const onMapSelectRef = useRef(onMapSelectPlace);

  const [routeMeta, setRouteMeta] = useState<{
    distanceKm: string;
    durationMins: number;
  } | null>(null);

  useEffect(() => {
    pinTargetRef.current = pinTarget;
  }, [pinTarget]);

  useEffect(() => {
    interactivePickRef.current = interactivePick;
  }, [interactivePick]);

  useEffect(() => {
    onMapSelectRef.current = onMapSelectPlace;
  }, [onMapSelectPlace]);

  const pickupLng = Number(pickupCoords[0]);
  const pickupLat = Number(pickupCoords[1]);
  const destLng = Number(destCoords[0]);
  const destLat = Number(destCoords[1]);
  const driverLng = driverCoords ? Number(driverCoords[0]) : undefined;
  const driverLat = driverCoords ? Number(driverCoords[1]) : undefined;

  // Chuỗi khóa ổn định cho danh sách điểm dừng để tránh re-render vô tận do tham chiếu mảng
  const stopsKey = stops
    .map(
      (s) =>
        `${s.name}:${Number(s.coords[0]).toFixed(5)},${Number(s.coords[1]).toFixed(5)}`,
    )
    .join("|");

  // 1. Khởi tạo bản đồ Leaflet DUY NHẤT 1 LẦN khi mount (chống nhấp nháy tuyệt đối)
  useEffect(() => {
    const container = mapContainer.current;
    if (!container || mapRef.current) return;

    const initialCenter: [number, number] = [pickupLat, pickupLng];
    const map = L.map(container, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
      fadeAnimation: true,
      zoomAnimation: true,
    });
    mapRef.current = map;

    // Position attribution bottom-right (default), minimal style
    map.attributionControl.setPrefix("");

    const tileLayer = L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      subdomains: "abc",
      attribution: OSM_ATTRIBUTION,
      crossOrigin: true,
      keepBuffer: 4,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Apply dark mode filter immediately so tiles look correct from the start
    setTimeout(() => {
      const tilePaneEl = map.getPanes().tilePane as HTMLElement | undefined;
      if (tilePaneEl) {
        tilePaneEl.style.filter = isDarkMode
          ? "invert(1) hue-rotate(200deg) brightness(0.85) contrast(1.1) saturate(0.9)"
          : "none";
      }
    }, 0);



    const routeGroup = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = routeGroup;

    const carIcon = L.divIcon({
      className: "qsm-map-car-icon",
      html: `<div class="qsm-car-marker-wrap" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;transition:transform 0.25s linear;transform:rotate(0deg);"><div style="width:32px;height:32px;border-radius:50%;background:#051923;border:2.5px solid #00f5d4;display:flex;align-items:center;justify-content:center;color:#00f5d4;box-shadow:0 0 16px rgba(0,245,212,0.85);"><svg width="18" height="18" viewBox="0 0 24 24" fill="#00f5d4" stroke="#00f5d4" stroke-width="1.5"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg></div></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    driverMarkerRef.current = L.marker(initialCenter, {
      icon: carIcon,
      zIndexOffset: 1000,
    })
      .bindPopup("Xe thuần điện QSM đang di chuyển theo lộ trình")
      .addTo(map);

    map.on("click", (ev: L.LeafletMouseEvent) => {
      if (!interactivePickRef.current) return;
      const target = pinTargetRef.current;
      void resolveCoordsToPlace(ev.latlng.lng, ev.latlng.lat, target).then(
        (place) => {
          onMapSelectRef.current?.(target, place);
        },
      );
    });

    // Tự động cân chỉnh kích thước khung bản đồ khi container thay đổi kích thước
    const resizeTimer = setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 100);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        map.invalidateSize({ animate: false });
      });
      observer.observe(container);
    }

    return () => {
      clearTimeout(resizeTimer);
      observer?.disconnect();
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      routeLayerGroupRef.current = null;
      driverMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Áp dụng CSS filter lên tile pane để đổi giao diện Sáng/Tối không cần đổi URL
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Leaflet renders tiles in .leaflet-tile-pane
    const tilePaneEl = map.getPanes().tilePane as HTMLElement | undefined;
    if (tilePaneEl) {
      tilePaneEl.style.filter = isDarkMode
        ? "invert(1) hue-rotate(200deg) brightness(0.85) contrast(1.1) saturate(0.9)"
        : "none";
    }
  }, [isDarkMode]);

  // 3. Cập nhật lộ trình, điểm đón/đến và các điểm dừng trên LayerGroup
  useEffect(() => {
    const map = mapRef.current;
    const routeGroup = routeLayerGroupRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    const pickupLatLng: [number, number] = [pickupLat, pickupLng];
    const destLatLng: [number, number] = [destLat, destLng];

    const pickupIcon = L.divIcon({
      className: "qsm-map-pin-icon",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#00f5d4;border:3px solid #ffffff;box-shadow:0 0 14px #00f5d4;cursor:${interactivePick ? "grab" : "pointer"};"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const destIcon = L.divIcon({
      className: "qsm-map-pin-icon",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#10b981;border:3px solid #ffffff;box-shadow:0 0 14px #10b981;cursor:${interactivePick ? "grab" : "pointer"};"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const pMarker = L.marker(pickupLatLng, {
      icon: pickupIcon,
      draggable: interactivePick,
    })
      .bindPopup(`<strong>Điểm đón:</strong> ${pickupName}`)
      .addTo(routeGroup);

    const dMarker = L.marker(destLatLng, {
      icon: destIcon,
      draggable: interactivePick,
    })
      .bindPopup(`<strong>Điểm đến:</strong> ${destName}`)
      .addTo(routeGroup);

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
    }

    stops.forEach((stop, sIdx) => {
      const stopLatLng: [number, number] = [stop.coords[1], stop.coords[0]];
      const stopIcon = L.divIcon({
        className: "qsm-map-stop-pin",
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#f59e0b;color:#051923;font-weight:900;font-size:11px;display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;box-shadow:0 0 12px #f59e0b;">${sIdx + 1}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker(stopLatLng, { icon: stopIcon })
        .bindPopup(
          `<strong>Điểm dừng ${sIdx + 1}:</strong> ${stop.name}<br/><small>${stop.address}</small>`,
        )
        .addTo(routeGroup);
    });

    const allKeyPoints: [number, number][] = [
      pickupLatLng,
      ...stops.map((s) => [s.coords[1], s.coords[0]] as [number, number]),
      destLatLng,
    ];

    const baseLine = L.polyline(allKeyPoints, {
      color: "#00f5d4",
      weight: 4,
      opacity: 0.75,
      dashArray: "6 6",
    }).addTo(routeGroup);

    const routeGeoKey = `${pickupLng.toFixed(5)},${pickupLat.toFixed(5)}->${stopsKey}->${destLng.toFixed(5)},${destLat.toFixed(5)}`;
    const shouldFitBounds = lastFittedRouteKeyRef.current !== routeGeoKey;
    if (shouldFitBounds) {
      lastFittedRouteKeyRef.current = routeGeoKey;
      map.fitBounds(L.latLngBounds(allKeyPoints), {
        padding: [44, 44],
        maxZoom: 16,
        animate: false,
      });
    }

    let isCancelled = false;
    void fetchRealRoute([pickupLng, pickupLat], [destLng, destLat], stops).then(
      (res) => {
        if (isCancelled || !res || !mapRef.current || !routeLayerGroupRef.current)
          return;
        routeLayerGroupRef.current.removeLayer(baseLine);
        routePathRef.current = res.coordinates;

        setRouteMeta((prev) => {
          if (
            prev &&
            prev.distanceKm === res.distanceKm &&
            prev.durationMins === res.durationMins
          ) {
            return prev;
          }
          return {
            distanceKm: res.distanceKm,
            durationMins: res.durationMins,
          };
        });

        const realPoly = L.polyline(res.coordinates, {
          color: "#00f5d4",
          weight: 5,
          opacity: 0.95,
        }).addTo(routeLayerGroupRef.current);

        if (shouldFitBounds) {
          mapRef.current.fitBounds(realPoly.getBounds(), {
            padding: [40, 40],
            maxZoom: 16,
            animate: false,
          });
        }
      },
    );

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pickupLng,
    pickupLat,
    destLng,
    destLat,
    stopsKey,
    pickupName,
    destName,
    interactivePick,
  ]);

  // 4. Cập nhật vị trí xe và góc xoay đầu xe theo hướng đường (Smooth Bearing)
  useEffect(() => {
    const marker = driverMarkerRef.current;
    if (!marker) return;

    const pts = routePathRef.current;
    if (pts.length > 1 && progress > 0) {
      const exactIdx = progress * (pts.length - 1);
      const idx = Math.min(pts.length - 1, Math.floor(exactIdx));
      const nextIdx = Math.min(pts.length - 1, idx + 1);
      const frac = exactIdx - idx;

      const p1 = pts[idx];
      const p2 = pts[nextIdx];
      const interpLat = p1[0] + (p2[0] - p1[0]) * frac;
      const interpLng = p1[1] + (p2[1] - p1[1]) * frac;
      marker.setLatLng([interpLat, interpLng]);

      const prevPt = pts[Math.max(0, idx - 1)];
      const refPt = idx < pts.length - 1 ? p2 : p1;
      const basePt = idx < pts.length - 1 ? p1 : prevPt;
      const bearing = computeBearing(basePt[0], basePt[1], refPt[0], refPt[1]);

      const el = marker
        .getElement()
        ?.querySelector(".qsm-car-marker-wrap") as HTMLElement | null;
      if (el) {
        el.style.transform = `rotate(${bearing}deg)`;
      }
    } else if (driverLat !== undefined && driverLng !== undefined) {
      marker.setLatLng([driverLat, driverLng]);
    } else {
      const lat = pickupLat + (destLat - pickupLat) * progress;
      const lng = pickupLng + (destLng - pickupLng) * progress;
      marker.setLatLng([lat, lng]);
    }
  }, [progress, driverLng, driverLat, pickupLng, pickupLat, destLng, destLat]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const userLng = Number(pos.coords.longitude.toFixed(5));
        const userLat = Number(pos.coords.latitude.toFixed(5));
        mapRef.current?.flyTo([userLat, userLng], 15, { duration: 0.9 });
        onGpsLocate?.([userLng, userLat], "Vị trí GPS của bạn");
      },
      () => {
        setLocating(false);
        mapRef.current?.flyTo([pickupLat, pickupLng], 14, { duration: 0.8 });
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

      {/* Nhãn điểm đón & điểm đến gọn gàng góc trái dưới */}
      <div className="map-hud-route-pills" style={{ zIndex: 450 }}>
        <span className="map-label pickup">
          <Navigation size={12} />
          <span>{pickupName}</span>
        </span>
        <span className="map-label destination">
          <MapPin size={12} />
          <span>{destName}</span>
        </span>
      </div>

      {/* Chế độ chạm bản đồ chọn nhanh Điểm đón / Điểm đến */}
      {interactivePick && (
        <div className="map-pin-mode-switcher" style={{ zIndex: 460 }}>
          <span className="pin-mode-label">Ghim bản đồ:</span>
          <button
            type="button"
            className={`pin-mode-btn ${pinTarget === "pickup" ? "active pickup" : ""}`}
            onClick={() => setPinTarget("pickup")}
          >
            ● Điểm đón
          </button>
          <button
            type="button"
            className={`pin-mode-btn ${pinTarget === "destination" ? "active dest" : ""}`}
            onClick={() => setPinTarget("destination")}
          >
            ● Điểm đến
          </button>
        </div>
      )}

      <span className="map-watermark" style={{ zIndex: 450 }}>
        {routeMeta
          ? `QSM GPS · ${routeMeta.distanceKm} km (~${routeMeta.durationMins} phút)`
          : "Bản đồ số QSM GPS"}
      </span>

      <button
        type="button"
        className="map-locate"
        style={{ zIndex: 460, cursor: "pointer", border: "none" }}
        title="Định vị GPS thiết bị của tôi"
        onClick={handleLocateMe}
      >
        <LocateFixed size={18} className={locating ? "spin-slow" : ""} />
      </button>
    </div>
  );
}
