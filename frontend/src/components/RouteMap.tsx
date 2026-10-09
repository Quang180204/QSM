import { Car, LocateFixed, MapPin, Navigation } from "lucide-react";
import type { Route } from "../data/catalog";
export default function RouteMap({
  route,
  mode = "route",
  progress = 0,
}: {
  route: Route;
  mode?: "route" | "search" | "pickup" | "trip";
  progress?: number;
}) {
  return (
    <div
      className={"route-map " + mode}
      role="img"
      aria-label={
        "Bản đồ mô phỏng tuyến " +
        route.pickup.name +
        " đến " +
        route.destination.name
      }
    >
      <svg viewBox="0 0 390 360" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern
            id="blocks"
            width="66"
            height="62"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-13)"
          >
            <rect width="66" height="62" fill="#eaf0e8" />
            <rect x="7" y="7" width="49" height="44" rx="5" fill="#f5f7ed" />
            <path d="M0 58 H66 M62 0 V62" stroke="#fff" strokeWidth="9" />
          </pattern>
        </defs>
        <rect width="390" height="360" fill="url(#blocks)" />
        <path
          d="M245 -20 C130 30 275 110 190 180 S100 230 185 390"
          fill="none"
          stroke="#afddd9"
          strokeWidth="42"
        />
        <path
          d="M-10 112L400 260M35 370L335 -10M-10 288L410 85"
          stroke="#fff"
          strokeWidth="13"
          fill="none"
        />
        <path
          d="M-10 112L400 260M35 370L335 -10M-10 288L410 85"
          stroke="#dddfc9"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={
            mode === "pickup"
              ? "M250 133L257 111L305 87"
              : "M95 265L120 220L215 173L257 111L305 87"
          }
          fill="none"
          stroke="#fff"
          strokeWidth="11"
          strokeLinejoin="round"
        />
        <path
          className="route-path"
          d={
            mode === "pickup"
              ? "M250 133L257 111L305 87"
              : "M95 265L120 220L215 173L257 111L305 87"
          }
          fill="none"
          stroke="#008c82"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="20" y="62">
          HAI BÀ TRƯNG
        </text>
        <text x="265" y="315">
          GIA LÂM
        </text>
        <text
          x="178"
          y="122"
          transform="rotate(24 178 122)"
          className="river-label"
        >
          Sông Hồng
        </text>
        <text x="133" y="205" className="road-label">
          Cầu Vĩnh Tuy
        </text>
        <circle
          cx="305"
          cy="87"
          r="7"
          fill="#006a61"
          stroke="white"
          strokeWidth="4"
        />
        <circle
          cx="95"
          cy="265"
          r="7"
          fill="#006a61"
          stroke="white"
          strokeWidth="4"
        />
        {mode === "search" || mode === "pickup" ? (
          <>
            <circle
              className="search-pulse"
              cx="305"
              cy="87"
              r="28"
              fill="none"
              stroke="#00f5d4"
              strokeWidth="1.5"
            />
            <circle
              className="search-pulse second"
              cx="305"
              cy="87"
              r="52"
              fill="none"
              stroke="#00f5d4"
              strokeWidth="1.2"
              opacity="0.6"
            />
          </>
        ) : null}
      </svg>
      <span className="map-label pickup">
        <Navigation size={13} />
        {route.pickup.name}
      </span>
      <span className="map-label destination">
        <MapPin size={13} />
        {route.destination.name}
      </span>
      {mode !== "route" && mode !== "pickup" ? (
        <span
          className={"map-car " + (mode === "trip" ? "moving" : "")}
          style={
            mode === "trip"
              ? {
                  left: 69 - progress * 0.42 + "%",
                  top: 34 + progress * 0.34 + "%",
                }
              : undefined
          }
        >
          <Car size={23} />
        </span>
      ) : null}
      {mode === "search" || mode === "pickup" ? (
        <>
          <span className="nearby-car a" title="VinFast VF 5 (Cách 280m)">
            <Car size={16} />
          </span>
          <span className="nearby-car b" title="VinFast Feliz S (Cách 420m)">
            <Car size={16} />
          </span>
          <span className="nearby-car c" title="Limo Green (Cách 750m)">
            <Car size={16} />
          </span>
        </>
      ) : null}
      <span className="map-watermark">Bản đồ mô phỏng</span>
      <span className="map-locate">
        <LocateFixed size={18} />
      </span>
    </div>
  );
}
