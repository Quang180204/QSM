import { RoundedBox, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { Shape } from "three";
import type { VehicleId } from "../../data/catalog";
import { vehicleById } from "../../data/catalog";

function Body({
  size,
  position,
  color = "#00aaa5",
  radius = 0.1,
}: {
  size: [number, number, number];
  position: [number, number, number];
  color?: string;
  radius?: number;
}) {
  return (
    <RoundedBox
      args={size}
      position={position}
      radius={radius}
      smoothness={3}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} metalness={0.42} roughness={0.25} />
    </RoundedBox>
  );
}
function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.33, 0.33, 0.24, 32]} />
        <meshStandardMaterial color="#182322" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.215, 0.215, 0.02, 24]} />
        <meshStandardMaterial
          color="#bdccca"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={i}
          position={[0, 0.146, 0]}
          rotation={[0, (i * Math.PI) / 5, 0]}
        >
          <boxGeometry args={[0.36, 0.018, 0.035]} />
          <meshStandardMaterial color="#435351" metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
function Cabin({ long }: { long: boolean }) {
  const shape = useMemo(() => {
    const s = new Shape();
    s.moveTo(-1, 0.72);
    s.lineTo(-0.68, 1.43);
    s.quadraticCurveTo(-0.58, 1.53, -0.4, 1.53);
    s.lineTo(long ? 1.1 : 0.55, 1.53);
    s.quadraticCurveTo(long ? 1.24 : 0.7, 1.5, long ? 1.3 : 0.77, 1.39);
    s.lineTo(long ? 1.54 : 1.1, 0.72);
    s.closePath();
    return s;
  }, [long]);
  return (
    <group>
      <mesh position={[0, 0, -0.67]} castShadow>
        <extrudeGeometry
          args={[
            shape,
            {
              depth: 1.34,
              bevelEnabled: true,
              bevelSegments: 3,
              steps: 1,
              bevelSize: 0.06,
              bevelThickness: 0.06,
            },
          ]}
        />
        <meshStandardMaterial
          color="#123b3d"
          metalness={0.45}
          roughness={0.17}
        />
      </mesh>
      <Body
        size={[long ? 1.95 : 1.35, 0.09, 1.4]}
        position={[long ? 0.35 : 0.05, 1.55, 0]}
        radius={0.035}
      />
      {[-1, 1].map((z) => (
        <group key={z}>
          <Body
            size={[0.055, 0.76, 0.045]}
            position={[-0.65, 1.1, z * 0.711]}
            radius={0.015}
          />
          <Body
            size={[0.045, 0.79, 0.045]}
            position={[long ? 0.39 : 0.18, 1.1, z * 0.711]}
            radius={0.014}
          />
          <Body
            size={[0.055, 0.62, 0.045]}
            position={[long ? 1.26 : 0.86, 1.05, z * 0.711]}
            radius={0.015}
          />
          <Body
            size={[0.18, 0.07, 0.03]}
            position={[-0.12, 0.75, z * 0.766]}
            color="#d9e9e6"
            radius={0.015}
          />
          <Body
            size={[0.24, 0.12, 0.18]}
            position={[-0.83, 1, z * 0.84]}
            radius={0.045}
          />
        </group>
      ))}
    </group>
  );
}
function Car({ long = false }: { long?: boolean }) {
  const length = long ? 4.45 : 3.45;
  return (
    <group>
      <Body
        size={[length, 0.58, 1.6]}
        position={[long ? 0.25 : 0, 0.61, 0]}
        radius={0.2}
      />
      <Body
        size={[length - 0.2, 0.12, 1.64]}
        position={[long ? 0.25 : 0, 0.31, 0]}
        color="#234646"
        radius={0.035}
      />
      <Cabin long={long} />
      {[-1, 1].flatMap((z) =>
        [-1.08, long ? 1.66 : 1.04].map((x) => (
          <Wheel key={x + "-" + z} position={[x, 0.34, z * 0.77]} />
        )),
      )}
      <Body
        size={[0.12, 0.15, 1.05]}
        position={[-length / 2 + 0.02, 0.67, 0]}
        color="#a9fff2"
        radius={0.04}
      />
      <Body
        size={[0.045, 0.23, 0.65]}
        position={[-length / 2 - 0.045, 0.43, 0]}
        color="#123335"
        radius={0.03}
      />
      <Body
        size={[0.05, 0.07, 0.82]}
        position={[-length / 2 - 0.06, 0.82, 0]}
        color="#ecf8f7"
        radius={0.02}
      />
      <Body
        size={[0.05, 0.11, 0.33]}
        position={[-length / 2 - 0.07, 0.47, 0]}
        color="#eff7f4"
        radius={0.01}
      />
      {[-1, 1].map((z) => (
        <Body
          key={z}
          size={[0.1, 0.18, 0.32]}
          position={[length / 2 + (long ? 0.2 : 0), 0.7, z * 0.53]}
          color="#cc434b"
          radius={0.025}
        />
      ))}
      <mesh
        position={[-length / 2 - 0.08, 0.76, 0]}
        rotation={[0, 0, Math.PI / 4]}
      >
        <boxGeometry args={[0.07, 0.07, 0.07]} />
        <meshStandardMaterial color="#f4faf9" metalness={0.8} />
      </mesh>
    </group>
  );
}
function Bike() {
  return (
    <group>
      <Wheel position={[-0.9, 0.34, 0]} />
      <Wheel position={[0.93, 0.34, 0]} />
      <Body size={[1.28, 0.19, 0.48]} position={[0.1, 0.42, 0]} radius={0.06} />
      <Body
        size={[0.84, 0.44, 0.55]}
        position={[0.52, 0.72, 0]}
        radius={0.13}
      />
      <Body
        size={[1.18, 0.15, 0.55]}
        position={[0.38, 1, 0]}
        color="#203536"
        radius={0.06}
      />
      <group rotation={[0, 0, -0.18]}>
        <Body
          size={[0.25, 0.9, 0.55]}
          position={[-0.65, 0.95, 0]}
          radius={0.09}
        />
        <Body
          size={[0.43, 0.26, 0.56]}
          position={[-0.78, 1.42, 0]}
          radius={0.07}
        />
        <Body
          size={[0.05, 0.13, 0.34]}
          position={[-1, 1.43, 0]}
          color="#dcfff6"
          radius={0.02}
        />
      </group>
      <Body
        size={[0.08, 0.09, 0.86]}
        position={[-0.64, 1.43, 0]}
        color="#243f3c"
        radius={0.025}
      />
      <Body
        size={[0.45, 0.35, 0.05]}
        position={[-0.68, 1.73, 0]}
        color="#b6e5de"
        radius={0.04}
      />
      <Body
        size={[0.07, 0.7, 0.1]}
        position={[-0.86, 0.68, 0]}
        color="#bdceca"
        radius={0.02}
      />
    </group>
  );
}
function GLBModel({ url, scale }: { url: string; scale: number }) {
  const { scene } = useGLTF(url);
  const copy = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={copy} scale={scale} />;
}
export function preloadVehicleModels() {
  for (const v of ["bike", "vf5", "limo"] as VehicleId[]) {
    const url = vehicleById(v).modelUrl;
    if (url) useGLTF.preload(url);
  }
}
export default function VehicleModel({ id }: { id: VehicleId }) {
  const v = vehicleById(id);
  return v.modelUrl ? (
    <GLBModel url={v.modelUrl} scale={v.modelScale ?? 1} />
  ) : id === "bike" ? (
    <Bike />
  ) : (
    <Car long={id === "limo"} />
  );
}
