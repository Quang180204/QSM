import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Group, MathUtils } from "three";
import type { VehicleId } from "../../data/catalog";
import VehicleModel, { preloadVehicleModels } from "./VehicleModel";
function AnimatedVehicle({ id, reduced }: { id: VehicleId; reduced: boolean }) {
  const ref = useRef<Group>(null);
  const progress = useRef(0);
  useEffect(() => {
    progress.current = 0;
  }, [id]);
  useFrame(({ clock, pointer }, delta) => {
    if (!ref.current) return;
    progress.current = Math.min(1, progress.current + delta / 0.65);
    const p = reduced ? 1 : 1 - Math.pow(1 - progress.current, 3);
    ref.current.position.x = (1 - p) * 0.7;
    ref.current.position.y = reduced
      ? 0
      : Math.sin(clock.elapsedTime * 0.8) * 0.008;
    ref.current.scale.setScalar(0.88 + p * 0.12);
    ref.current.rotation.y = MathUtils.lerp(
      ref.current.rotation.y,
      0.12 +
        (reduced
          ? 0
          : pointer.x * 0.12 + Math.sin(clock.elapsedTime * 0.3) * 0.025) +
        (1 - p) * 0.2,
      0.08,
    );
  });
  return (
    <group ref={ref}>
      <VehicleModel id={id} />
    </group>
  );
}
export default function VehicleScene({
  id,
  active,
  reduced,
}: {
  id: VehicleId;
  active: boolean;
  reduced: boolean;
}) {
  useEffect(() => {
    preloadVehicleModels();
  }, []);
  return (
    <Canvas
      camera={{ position: [-4.8, 2.7, 5.3], fov: 28 }}
      dpr={[1, 1.5]}
      frameloop={active && !reduced ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl, camera }) => {
        camera.lookAt(0, 0.65, 0);
        gl.setClearColor("#edf7f6", 0);
      }}
    >
      <hemisphereLight args={["#ffffff", "#72bcb0", 2]} />
      <directionalLight position={[-3, 5, 3]} intensity={3} />
      <Environment resolution={128}>
        <Lightformer intensity={3} position={[0, 5, -2]} scale={[8, 3, 1]} />
        <Lightformer intensity={2} position={[-5, 2, 2]} scale={[3, 4, 1]} />
      </Environment>
      <AnimatedVehicle id={id} reduced={reduced} />
      <ContactShadows
        position={[0, -0.035, 0]}
        opacity={0.4}
        scale={9}
        blur={2.5}
        far={3}
        resolution={256}
        frames={active && !reduced ? Infinity : 1}
      />
    </Canvas>
  );
}
