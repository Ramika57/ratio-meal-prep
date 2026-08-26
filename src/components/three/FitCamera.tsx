"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";

/**
 * Frames the tray to fit whatever canvas it is given.
 *
 * three.js `fov` is the VERTICAL field of view, so on a tall narrow phone the
 * horizontal field collapses with the aspect ratio: at 375x812 and fov 30 the
 * horizontal angle is only 14 degrees, and a 2.55 unit wide tray needs to be
 * 12.7 units away to fit inside it. The fixed camera sat at 5.9, which is why
 * the tray ran off both edges of the screen. Desktop was cropping too, by 24
 * percent.
 *
 * Rather than hand tuning a distance per breakpoint, solve it: take the tray's
 * bounding radius, work out the distance at which it fits both the vertical and
 * the horizontal field, and use the larger. Correct at every aspect ratio,
 * including mid rotation on an orientation change.
 */
export function FitCamera({
  radius = 1.62,
  margin = 1.1,
  elevation = 0.62,
}: {
  /** Bounding radius of the subject in the horizontal plane. */
  radius?: number;
  /** Breathing room around the subject. 1 is a tight fit. */
  margin?: number;
  /** How far above the subject the camera sits, as a ratio of its distance. */
  elevation?: number;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    if (!cam.isPerspectiveCamera || !size.height) return;

    const aspect = size.width / size.height;
    const vFov = (cam.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

    const distV = radius / Math.tan(vFov / 2);
    const distH = radius / Math.tan(hFov / 2);
    const distance = Math.max(distV, distH) * margin;

    // Hold the viewing angle, change only how far back it sits.
    const dir = new Vector3(0, elevation, 1).normalize().multiplyScalar(distance);
    cam.position.copy(dir);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size, radius, margin, elevation]);

  return null;
}
