import {
  Check,
  Clock,
  MapPin,
  Route as RouteIcon,
  Users,
  Wallet,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import type { Place, Route, Vehicle, VehicleId } from "../../data/catalog";
import { driver, money, vehicleById } from "../../data/catalog";
import type { RideState } from "../../state/rideMachine";
import RouteMap from "../RouteMap";
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
export function LocationConfirmationCard({
  route,
  onConfirm,
  onEdit,
}: {
  route: Route;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  return (
    <article className="smart-card">
      <h3>
        <MapPin size={18} />
        Kiểm tra địa điểm
      </h3>
      <RouteDetails route={route} />
      <RouteMap route={route} />
      <div className="actions">
        <button className="button secondary" onClick={onEdit}>
          Chỉnh sửa
        </button>
        <button className="button primary" onClick={onConfirm}>
          Xác nhận địa điểm
          <Check size={16} />
        </button>
      </div>
    </article>
  );
}
export function LocationCandidatesCard({
  candidates,
  onSelect,
}: {
  candidates: Place[];
  onSelect: (p: Place) => void;
}) {
  return (
    <article className="smart-card">
      <h3>Bạn muốn đến địa điểm nào?</h3>
      <p>Có nhiều kết quả. Bạn chọn đúng địa chỉ giúp mình nhé.</p>
      {candidates.map((p) => (
        <button
          key={p.address}
          className="candidate"
          onClick={() => onSelect(p)}
        >
          <MapPin size={18} />
          <span>
            <strong>{p.name}</strong>
            <small>{p.address}</small>
          </span>
          <ArrowRight size={17} />
        </button>
      ))}
    </article>
  );
}
export function RouteSummaryCard({ route }: { route: Route }) {
  return (
    <div className="route-summary">
      <RouteIcon size={18} />
      <strong>{String(route.distance).replace(".", ",")} km</strong>
      <span>Khoảng {route.duration} phút · Qua cầu Vĩnh Tuy</span>
    </div>
  );
}
export function VehicleOptionCard({
  vehicle,
  selected,
  onSelect,
}: {
  vehicle: Vehicle;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={"vehicle-option " + (selected ? "chosen" : "")}
      onClick={onSelect}
    >
      <span className="vehicle-mini">
        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="smartcard-vehicle-thumb"
        />
      </span>
      <span className="option-description">
        <strong>{vehicle.name}</strong>
        <small>{vehicle.realModelName}</small>
        <span>
          <Users size={12} />
          {vehicle.capacity} khách · {vehicle.eta} phút đến
        </span>
      </span>
      <span className="option-price">
        <strong>{money(vehicle.fare)}</strong>
        {selected ? <Check size={17} /> : null}
      </span>
    </button>
  );
}
export function VehicleComparisonCard({
  options,
  selected,
  onSelect,
}: {
  options: Vehicle[];
  selected: VehicleId;
  onSelect: (id: VehicleId) => void;
}) {
  return (
    <article className="smart-card">
      <h3>Chọn xe cho hành trình</h3>
      <p>Giá dự kiến cho tuyến đường của bạn</p>
      {options.map((v) => (
        <VehicleOptionCard
          key={v.id}
          vehicle={v}
          selected={v.id === selected}
          onSelect={() => onSelect(v.id)}
        />
      ))}
    </article>
  );
}
export function FareQuoteCard({ ride }: { ride: RideState }) {
  return (
    <div className="fare-quote">
      <span>
        Giá dự kiến<small>Đã bao gồm thuế · Giá mô phỏng</small>
      </span>
      <strong>{money(vehicleById(ride.vehicle).fare)}</strong>
    </div>
  );
}
export function BookingConfirmationCard({
  ride,
  onConfirm,
  onEdit,
  onCancel,
  pending,
  onPayment,
}: {
  ride: RideState;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  pending: boolean;
  onPayment: (v: string) => void;
}) {
  const v = vehicleById(ride.vehicle);
  return (
    <article className="smart-card confirmation">
      <span className="badge">
        <Check size={13} />
        Chờ bạn xác nhận
      </span>
      <h3>Xác nhận chuyến đi</h3>
      <div className="confirmation-vehicle-hero">
        <img src={v.image} alt={v.name} className="confirmation-vehicle-img" />
        <div className="confirmation-vehicle-info">
          <strong>{v.name}</strong>
          <small>{v.realModelName}</small>
          <span className="ev-tag">100% Thuần điện</span>
        </div>
      </div>
      <RouteDetails route={ride.route} />
      <dl className="summary-list">
        <div>
          <dt>Phương tiện</dt>
          <dd>
            {v.name} · {v.capacity} khách
          </dd>
        </div>
        <div>
          <dt>Quãng đường</dt>
          <dd>{String(ride.route.distance).replace(".", ",")} km</dd>
        </div>
        <div>
          <dt>Thời gian di chuyển</dt>
          <dd>{ride.route.duration} phút</dd>
        </div>
        <div>
          <dt>Xe đến đón</dt>
          <dd>Khoảng {v.eta} phút</dd>
        </div>
      </dl>
      <label className="payment">
        <Wallet size={18} />
        Thanh toán
        <select
          aria-label="Phương thức thanh toán"
          value={ride.payment}
          onChange={(e) => onPayment(e.target.value)}
        >
          <option>Tiền mặt</option>
          <option>Ví GSM</option>
        </select>
      </label>
      <FareQuoteCard ride={ride} />
      <button
        className="button primary wide"
        disabled={pending}
        onClick={onConfirm}
      >
        {pending ? "Đang xác nhận…" : "Xác nhận đặt xe"}
        <ArrowRight size={18} />
      </button>
      <div className="actions">
        <button
          className="button secondary"
          disabled={pending}
          onClick={onEdit}
        >
          Chỉnh sửa chuyến
        </button>
        <button className="button ghost" disabled={pending} onClick={onCancel}>
          Hủy
        </button>
      </div>
    </article>
  );
}
export function BookingSuccessCard({ onTrack }: { onTrack: () => void }) {
  return (
    <article className="smart-card">
      <h3>
        <Check />
        Yêu cầu đã được xác nhận
      </h3>
      <p>Mình đang tìm tài xế phù hợp cho bạn.</p>
      <button className="button primary wide" onClick={onTrack}>
        Theo dõi chuyến đi
        <ArrowRight size={17} />
      </button>
    </article>
  );
}
export function TripStatusCard({ ride }: { ride: RideState }) {
  return (
    <article className="smart-card">
      <h3>
        <Clock size={18} />
        Thông tin chuyến đi
      </h3>
      <p>
        {ride.status === "TRIP_STARTED"
          ? "Còn khoảng 18 phút · 7,2 km"
          : ride.status === "DRIVER_ARRIVED"
            ? "Tài xế đã đến sảnh điểm đón"
            : ride.status === "SEARCHING_DRIVER"
              ? "Đang tìm tài xế phù hợp…"
              : ride.status === "TRIP_COMPLETED"
                ? "Bạn đã đến nơi an toàn."
                : "Tài xế " + driver.name + " đang đến đón bạn."}
      </p>
    </article>
  );
}
export function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <article className="smart-card error-card" role="alert">
      <h3>
        <AlertCircle size={18} />
        Chưa thể hoàn tất
      </h3>
      <p>{message}</p>
      <button className="button secondary" onClick={onRetry}>
        Thử lại
      </button>
    </article>
  );
}
