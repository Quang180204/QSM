import { MapPin } from "lucide-react";
import type { Route } from "../data/catalog";

export function RouteDetails({ route }: { route: Route }) {
  return (
    <div className="route-details">
      <div>
        <span className="pickup-dot" />
        <section>
          <small>Điểm đón</small>
          <strong>{route.pickup.name}</strong>
          <p>{route.pickup.address}</p>
        </section>
      </div>
      <div>
        <MapPin size={17} />
        <section>
          <small>Điểm đến</small>
          <strong>{route.destination.name}</strong>
          <p>{route.destination.address}</p>
        </section>
      </div>
    </div>
  );
}

