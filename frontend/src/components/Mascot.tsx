
export function MascotHead({ size = 38 }: { size?: number }) {
  return (
    <span
      className="mascot-avatar-head"
      style={{ width: size, height: size }}
      aria-label="Trợ lý AI GSM"
    >
      <img
        src="/images/robot-head.png"
        alt="AI GSM Head"
        className="mascot-img-head"
        draggable={false}
      />
      <span className="mascot-head-glow" />
    </span>
  );
}

export default function Mascot({
  full = false,
  headOnly = false,
  size,
}: {
  full?: boolean;
  headOnly?: boolean;
  size?: number;
}) {
  if (headOnly) {
    return <MascotHead size={size} />;
  }

  if (full) {
    return (
      <div
        className="mascot-full-container"
        role="img"
        aria-label="Robot AI GSM 3D thuần điện"
      >
        <div className="mascot-float-wrapper">
          <img
            src="/images/robot-clean.png"
            alt="Robot AI GSM 3D"
            className="mascot-img-full"
            draggable={false}
          />
          <div className="mascot-ground-shadow" />
        </div>
      </div>
    );
  }

  return (
    <span
      className="mascot-avatar-head"
      style={size ? { width: size, height: size } : undefined}
      role="img"
      aria-label="Trợ lý AI GSM"
    >
      <img
        src="/images/robot-head.png"
        alt="Trợ lý AI GSM"
        className="mascot-img-head"
        draggable={false}
      />
      <span className="mascot-head-glow" />
    </span>
  );
}
