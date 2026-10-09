import type { Route } from "../data/catalog";
import { useTheme } from "../state/ThemeContext";
import RealRouteMap from "./RealRouteMap";

export default function RouteMap({
  route,
  mode = "route",
  progress = 0,
  onGpsLocate,
}: {
  route: Route;
  mode?: "route" | "search" | "pickup" | "trip";
  progress?: number;
  onGpsLocate?: (coords: [number, number], label: string) => void;
}) {
  const { theme } = useTheme();
  const pickupCoords: [number, number] = route.pickup.coords || [105.9445, 20.9905];
  const destCoords: [number, number] = route.destination.coords || [105.8685, 20.9962];

  return (
    <div
      className={"route-map " + mode}
      role="img"
      aria-label={
        "Bản đồ định vị GPS tuyến " +
        route.pickup.name +
        " đến " +
        route.destination.name
      }
    >
      <RealRouteMap
        pickupCoords={pickupCoords}
        destCoords={destCoords}
        pickupName={route.pickup.name}
        destName={route.destination.name}
        isDarkMode={theme === "dark"}
        progress={progress}
        onGpsLocate={onGpsLocate}
      />
    </div>
  );
}
