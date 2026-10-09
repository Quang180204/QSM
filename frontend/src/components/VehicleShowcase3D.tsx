import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Zap,
  MoveUpRight,
  Sparkles,
  Gauge,
  BatteryCharging,
  Rotate3d,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { vehicles } from "../data/catalog";
import type { VehicleId } from "../data/catalog";

export default function VehicleShowcase3D({
  onBook,
}: {
  onBook: (id: VehicleId) => void;
}) {
  const [index, setIndex] = useState(1); // Default to VF5 (index 1)
  const [details, setDetails] = useState(false);
  const [isRotating, setIsRotating] = useState(true); // Auto 360° rotation enabled by default!
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const cardRef = useRef<HTMLDivElement>(null);
  const swipe = useRef(0);
  const reduced = !!useReducedMotion();
  const v = vehicles[index];

  const change = (n: number) => {
    setIndex((prev) => (prev + n + vehicles.length) % vehicles.length);
    setDetails(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -(y * 12), y: x * 18 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section className="showcase" aria-label="Đội xe GSM">
      {/* Top Bar: 'GSM' tech badge and clean navigation arrows */}
      <div className="section-line">
        <div className="showcase-badge-wrap">
          <span className="tech-chip gsm-badge">
            <Zap size={14} className="badge-glow-icon" />
            <strong className="badge-gsm-text">GSM</strong>
          </span>
        </div>
        <div className="carousel-arrows">
          <button
            className="icon-button"
            aria-label="Xe trước"
            onClick={() => change(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="icon-button"
            aria-label="Xe tiếp theo"
            onClick={() => change(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Vehicle Header Info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={v.id}
          initial={{ opacity: 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="vehicle-heading"
        >
          <div className="heading-top-badges">
            <span className="badge primary-badge">{v.label}</span>
            <span className="badge model-badge">{v.realModelName}</span>
          </div>
          <h2>
            {v.name}
            <span className="brand-dot"> · GSM</span>
          </h2>
          <p>{v.tagline}</p>
        </motion.div>
      </AnimatePresence>

      {/* 360° Studio Controls (Pure auto 360 rotate, no WebGL/Studio text) */}
      <div className="showcase-controls-bar">
        <button
          className={`mode-btn rotate-btn ${isRotating ? "active" : ""}`}
          onClick={() => setIsRotating((prev) => !prev)}
          title="Bật/Tắt hiệu ứng tự động xoay 360 độ"
        >
          <Rotate3d size={15} className={isRotating ? "spin-icon" : ""} />
          <span>{isRotating ? "Tự động xoay 360°" : "Tạm dừng xoay"}</span>
        </button>
      </div>

      {/* Futuristic 3D Studio Pedestal Canvas */}
      <div
        className="vehicle-canvas"
        ref={cardRef}
        role="img"
        aria-label={"Mô hình 360° " + v.name + " GSM"}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={(e) => {
          swipe.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const diff = e.changedTouches[0].clientX - swipe.current;
          if (Math.abs(diff) > 45) change(diff > 0 ? -1 : 1);
        }}
      >
        {/* Galaxy cyber aura & background lights */}
        <div className="studio-halo" />
        <div className="cyber-grid-floor" />

        {/* 3D Rotational Stage with auto-spin and tilt */}
        <div
          className={`real-stage-container ${isRotating ? "rotating-stage" : ""}`}
          style={{
            transform: `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          {/* Holographic vertical scan line */}
          <div className="hologram-scanner" />

          {/* High-tech Multi-tier Neon Pedestal */}
          <div className="podium-disc">
            <div className="podium-ring-outer" />
            <div className="podium-ring-dashed" />
            <div className="podium-ring-inner" />
            <div className="podium-glow-center" />
          </div>

          {/* Clean Transparent Vehicle Studio Cutout */}
          <div className="vehicle-image-wrapper">
            <AnimatePresence mode="wait">
              <motion.img
                key={v.id}
                src={v.image}
                alt={v.name}
                className="vehicle-real-photo"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.28 }}
                draggable={false}
              />
            </AnimatePresence>
          </div>

          {/* Under-chassis neon floor reflection */}
          <div className="vehicle-reflection" aria-hidden="true">
            <img src={v.image} alt="" draggable={false} />
          </div>
        </div>

        {/* Floating Telemetry Chips */}
        <div className="telemetry-badges">
          <span className="telemetry-chip battery">
            <BatteryCharging size={13} />
            {v.battery}
          </span>
          <span className="telemetry-chip range">
            <Gauge size={13} />
            {v.range}
          </span>
        </div>

        <span className="scene-caption">
          <Sparkles size={12} /> Chạm hoặc di chuột để nghiêng 3D · Tự động xoay 360°
        </span>
      </div>

      {/* Vehicle Pagination Tabs */}
      <div className="vehicle-pagination" aria-label="Chọn phương tiện">
        {vehicles.map((item, i) => (
          <button
            key={item.id}
            aria-label={item.name}
            aria-pressed={index === i}
            onClick={() => {
              setIndex(i);
              setDetails(false);
            }}
            className={index === i ? "selected" : ""}
          >
            <img
              src={item.image}
              alt=""
              className="tab-vehicle-thumb"
              draggable={false}
            />
            <span>{item.name}</span>
          </button>
        ))}
      </div>

      {/* Quick Specs Bar */}
      <div className="vehicle-specs">
        <span>
          <Users size={16} />
          {v.capacity} chỗ ngồi
        </span>
        <span>
          <Zap size={16} />
          100% Thuần điện
        </span>
        <span>
          <ShieldCheck size={16} />
          Đón từ ~{v.eta} phút
        </span>
      </div>

      {/* Action Buttons */}
      <div className="actions">
        <button
          className="button secondary"
          onClick={() => setDetails(!details)}
        >
          <Cpu size={17} />
          {details ? "Đóng thông số" : "Khám phá công nghệ"}
        </button>
        <button className="button primary" onClick={() => onBook(v.id)}>
          <span>Đặt xe này với AI</span>
          <MoveUpRight size={17} />
        </button>
      </div>

      {/* Expandable Tech Specs Drawer */}
      {details ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="vehicle-details"
        >
          <div className="details-header">
            <strong>{v.benefit}</strong>
            <span className="co2-badge">{v.co2Saving}</span>
          </div>
          <p>{v.description}</p>
          <div className="specs-grid-2026">
            <div className="spec-card">
              <span className="spec-label">Động cơ & Sức mạnh</span>
              <strong className="spec-val">{v.power}</strong>
            </div>
            <div className="spec-card">
              <span className="spec-label">Quãng đường tối đa</span>
              <strong className="spec-val">{v.range}</strong>
            </div>
            <div className="spec-card">
              <span className="spec-label">Hệ thống Pin</span>
              <strong className="spec-val">{v.battery}</strong>
            </div>
            <div className="spec-card">
              <span className="spec-label">Công nghệ hỗ trợ</span>
              <strong className="spec-val">AI Trợ lý GSM 2026</strong>
            </div>
          </div>
        </motion.div>
      ) : null}
    </section>
  );
}
