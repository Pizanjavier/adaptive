type Vec3 = [number, number, number];

interface Mesh {
  vertices: Vec3[];
  edges: [number, number][];
}

export function createSphere(radius: number, segments: number): Mesh {
  const vertices: Vec3[] = [];
  const edges: [number, number][] = [];

  for (let lat = 0; lat <= segments; lat++) {
    const theta = (lat / segments) * Math.PI;
    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon / segments) * Math.PI * 2;
      vertices.push([
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.cos(theta),
        radius * Math.sin(theta) * Math.sin(phi),
      ]);
    }
  }

  const cols = segments + 1;
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const curr = lat * cols + lon;
      edges.push([curr, curr + 1]);
      edges.push([curr, curr + cols]);
    }
  }

  return { vertices, edges };
}

export function createTorus(major: number, minor: number, segments: number): Mesh {
  const vertices: Vec3[] = [];
  const edges: [number, number][] = [];

  for (let i = 0; i <= segments; i++) {
    const u = (i / segments) * Math.PI * 2;
    for (let j = 0; j <= segments; j++) {
      const v = (j / segments) * Math.PI * 2;
      vertices.push([
        (major + minor * Math.cos(v)) * Math.cos(u),
        minor * Math.sin(v),
        (major + minor * Math.cos(v)) * Math.sin(u),
      ]);
    }
  }

  const cols = segments + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const curr = i * cols + j;
      edges.push([curr, curr + 1]);
      edges.push([curr, curr + cols]);
    }
  }

  return { vertices, edges };
}

function rotateY(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [v[0] * cos + v[2] * sin, v[1], -v[0] * sin + v[2] * cos];
}

function rotateX(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [v[0], v[1] * cos - v[2] * sin, v[1] * sin + v[2] * cos];
}

function project(v: Vec3, fov: number, cx: number, cy: number): [number, number] {
  const z = v[2] + fov;
  const scale = fov / z;
  return [v[0] * scale + cx, v[1] * scale + cy];
}

export function drawWireframe(
  ctx: CanvasRenderingContext2D,
  mesh: Mesh,
  angleX: number,
  angleY: number,
  width: number,
  height: number,
  color: string,
): void {
  const fov = 400;
  const cx = width / 2;
  const cy = height / 2;

  const projected = mesh.vertices.map((v) => {
    const r1 = rotateY(v, angleY);
    const r2 = rotateX(r1, angleX);
    return project(r2, fov, cx, cy);
  });

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  ctx.globalAlpha = 0.4;

  for (const [a, b] of mesh.edges) {
    if (a >= projected.length || b >= projected.length) continue;
    ctx.beginPath();
    ctx.moveTo(projected[a][0], projected[a][1]);
    ctx.lineTo(projected[b][0], projected[b][1]);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
