<script>
  import rough from "roughjs";
  import {onMount} from "svelte";

  // canvas
  let canvas = {
    el: null,
    width: window.innerWidth * 0.9,
    height: window.innerHeight * 0.9,
  };

  window.addEventListener("optimizedResize", () => {
    (canvas.width = window.innerWidth * 0.9),
      (canvas.height = window.innerHeight * 0.9);
  });

  onMount(() => {
    const roughCanvas = rough.canvas(canvas.el);

    roughCanvas.line(60, 60, 190, 60);
    roughCanvas.line(60, 60, 190, 60, {strokeWidth: 5});

    roughCanvas.rectangle(10, 10, 100, 100);
    roughCanvas.rectangle(140, 10, 100, 100, {fill: "red"});

    roughCanvas.ellipse(350, 50, 150, 80);
    roughCanvas.ellipse(610, 50, 150, 80, {fill: "blue", stroke: "red"});

    roughCanvas.circle(480, 50, 80);

    roughCanvas.linearPath([
      [690, 10],
      [790, 20],
      [750, 120],
      [690, 100],
    ]);

    roughCanvas.polygon([
      [690, 130],
      [790, 140],
      [750, 240],
      [690, 220],
    ]);

    roughCanvas.arc(350, 300, 200, 180, Math.PI, Math.PI * 1.6, true);
    roughCanvas.arc(350, 300, 200, 180, 0, Math.PI / 2, true, {
      stroke: "red",
      strokeWidth: 4,
      fill: "rgba(255,255,0,0.4)",
      fillStyle: "solid",
    });
    roughCanvas.arc(350, 300, 200, 180, Math.PI / 2, Math.PI, true, {
      stroke: "blue",
      strokeWidth: 2,
      fill: "rgba(255,0,255,0.4)",
    });

    // draw sine curve
    let points = [];
    for (let i = 0; i < 20; i++) {
      let x = (400 / 20) * i + 10;
      let xdeg = (Math.PI / 100) * x;
      let y = Math.round(Math.sin(xdeg) * 90) + 500;
      points.push([x, y]);
    }
    roughCanvas.curve(points, {
      stroke: "red",
      strokeWidth: 3,
    });

    roughCanvas.path("M37,17v15H14V17z M50,0H0v50h50z");
    roughCanvas.path("M80 80 A 45 45, 0, 0, 0, 125 125 L 125 80 Z", {
      fill: "green",
    });
  });
</script>

<canvas class="canvas" width={canvas.width} height={canvas.height} bind:this={canvas.el} />

<style>
  .canvas {
    margin: 10px;
  }
</style>
