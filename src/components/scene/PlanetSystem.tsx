"use client";

import Planet from "./Planet";
import { PLANETS } from "@/lib/planets-data";

export default function PlanetSystem() {
  return (
    <group>
      {PLANETS.map((p, i) => (
        <Planet
          key={p.id}
          data={p}
          initialAngle={(i / PLANETS.length) * Math.PI * 2}
        />
      ))}
    </group>
  );
}
