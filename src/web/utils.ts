export function getCanvasRelativePosition(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
}

export type Point = { x: number; y: number };
export function P(x: number, y: number) {
  return { x, y };
}

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  p: Point,
  { color } = { color: 'black' },
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(p.x, p.y, 1, 1);
  ctx.restore();
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  { color } = { color: 'black' },
) {
  let transpose = false;
  let s = start;
  let e = end;

  if (Math.abs(start.x - end.x) < Math.abs(start.y - end.y)) {
    // 斜率大于1，delta y > delta x
    s = P(start.y, start.x);
    e = P(end.y, end.x);
    transpose = true;
  }

  if (s.x > e.x) {
    const temp = s;
    s = P(e.x, e.y);
    e = P(temp.x, temp.y);
  }

  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const dy2 = 2 * Math.abs(dy);
  const dx2 = 2 * dx;
  let { y } = s;
  let error = 0;

  for (let { x } = s; x <= e.x; ++x) {
    drawPoint(ctx, transpose ? P(y, x) : P(x, y), { color });

    error += dy2;
    if (error > dx) {
      y += dy > 0 ? 1 : -1;
      error -= dx2;
    }
  }
}
