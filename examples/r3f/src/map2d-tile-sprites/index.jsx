import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { DemoOrDie } from "./map2d-tile-sprites";

const root = createRoot(document.getElementById("root"));

root.render(
  <Canvas dpr={[1, 2]} camera={{ position: [0, 350, 500], far: 8000 }}>
    <StrictMode>
      <DemoOrDie />
      <OrbitControls autoRotate />
    </StrictMode>
  </Canvas>
);
