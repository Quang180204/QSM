import { defaultRoute } from "../data/catalog";
import type { Place, Route } from "../data/catalog";
export const wait = (ms = 600) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
export const mapsService = {
  async resolve(
    text: string,
  ): Promise<{
    route?: Route;
    candidates?: Place[];
    needsPickup?: boolean;
    needsDestination?: boolean;
  }> {
    await wait();
    if (/lỗi|thử lỗi/i.test(text))
      throw new Error("Chưa thể xác định địa điểm. Vui lòng thử lại.");
    if (/highlands.*bà triệu/i.test(text))
      return {
        candidates: [
          {
            name: "Highlands Coffee · Vincom Bà Triệu",
            address: "191 Bà Triệu, Hà Nội",
          },
          {
            name: "Highlands Coffee · Bà Triệu",
            address: "42 Bà Triệu, Hà Nội",
          },
        ],
      };
    const match = text.match(/từ\s+(.+?)\s+(?:đến|tới)\s+(.+?)[.!]?$/i);
    if (!match)
      return {
        needsPickup: true,
        needsDestination: !/times city|nội bài|vincom/i.test(text),
      };
    const place = (s: string): Place =>
      /vinuni/i.test(s)
        ? defaultRoute.pickup
        : /times city/i.test(s)
          ? defaultRoute.destination
          : { name: s.trim(), address: "Địa chỉ cần bạn kiểm tra và xác nhận" };
    return {
      route: {
        pickup: place(match[1]),
        destination: place(match[2]),
        distance: 11.5,
        duration: 22,
      },
    };
  },
};
