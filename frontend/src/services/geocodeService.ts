import { locationDirectory, type Place } from "../data/catalog";

// Reverse Geocoding: Tọa độ -> Tên địa điểm & Địa chỉ thực
export async function reverseGeocodeCoords(
  lng: number,
  lat: number,
  fallbackLabel = "Vị trí GPS hiện tại",
): Promise<Place> {
  // 1. Kiểm tra xem có gần danh mục mẫu trong bán kính ~400m không
  for (const item of locationDirectory) {
    const dLng = Math.abs(item.coords[0] - lng);
    const dLat = Math.abs(item.coords[1] - lat);
    if (dLng < 0.004 && dLat < 0.004) {
      return item;
    }
  }

  // 2. Gọi OpenStreetMap Nominatim reverse geocode miễn phí
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "vi" },
      },
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as {
        name?: string;
        display_name?: string;
        address?: {
          road?: string;
          suburb?: string;
          quarter?: string;
          neighbourhood?: string;
          city_district?: string;
          city?: string;
          state?: string;
        };
      };

      const road =
        data.name ||
        data.address?.road ||
        data.address?.suburb ||
        data.address?.city_district ||
        fallbackLabel;

      const shortAddr =
        data.display_name?.split(",").slice(0, 4).join(",").trim() ||
        `Tọa độ GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      return {
        name: road,
        address: shortAddr,
        coords: [Number(lng.toFixed(5)), Number(lat.toFixed(5))],
        category: "Điểm trung tâm",
      };
    }
  } catch {
    // Timeout hoặc lỗi mạng -> fallback dưới
  }

  return {
    name: fallbackLabel,
    address: `Tọa độ GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    coords: [Number(lng.toFixed(5)), Number(lat.toFixed(5))],
    category: "Điểm trung tâm",
  };
}

// Forward Geocoding: Từ khóa tìm kiếm -> Tọa độ thực (OSM Nominatim)
export async function geocodeSearch(query: string): Promise<Place | null> {
  const clean = query.trim();
  if (!clean) return null;

  // 1. Tìm kiếm trong danh mục mẫu có sẵn trước
  const lower = clean.toLowerCase();
  const directMatch = locationDirectory.find(
    (p) =>
      p.name.toLowerCase() === lower ||
      p.name.toLowerCase().includes(lower) ||
      p.address.toLowerCase().includes(lower),
  );
  if (directMatch) return directMatch;

  // 2. Gọi Nominatim OpenStreetMap tìm kiếm địa chỉ thực tại Việt Nam
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      clean,
    )}&countrycodes=vn&format=json&limit=1&accept-language=vi`;

    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { "Accept-Language": "vi" },
    });
    clearTimeout(timer);

    if (res.ok) {
      const list = (await res.json()) as Array<{
        name?: string;
        display_name?: string;
        lat: string;
        lon: string;
      }>;

      if (list && list.length > 0) {
        const item = list[0];
        const lat = Number(Number(item.lat).toFixed(5));
        const lng = Number(Number(item.lon).toFixed(5));
        return {
          name: item.name || clean,
          address: item.display_name?.split(",").slice(0, 4).join(",").trim() || clean,
          coords: [lng, lat],
          category: "Điểm trung tâm",
        };
      }
    }
  } catch {
    // bỏ qua lỗi mạng
  }

  return null;
}
