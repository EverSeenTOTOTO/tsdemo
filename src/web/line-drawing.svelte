<script>
  import OBJFile from "obj-file-parser";
  import { drawLine, P } from "./utils";
  import { onMount } from "svelte";

  // canvas
  let canvas;
  onMount(async () => {
    const ctx = canvas.getContext("2d");

    const obj = await fetch(
      "https://raw.githubusercontent.com/ssloy/tinyrenderer/f6fecb7ad493264ecd15e230411bfb1cca539a12/obj/african_head.obj"
    ).then((rsp) => rsp.text());

    const objFile = new OBJFile(obj).parse();
    const { faces, vertices } = objFile.models[0];

    const width = 800;
    const height = 800;

    for (const record of faces) {
      for (let i = 0; i < 3; ++i) {
        // 连接三角形的三个顶点
        const v0 = vertices[record.vertices[i].vertexIndex - 1];
        const v1 = vertices[record.vertices[(i + 1) % 3].vertexIndex - 1];

        const x0 = ((v0.x + 1) * width) / 2;
        const y0 = ((v0.y + 1) * height) / 2;
        const x1 = ((v1.x + 1) * width) / 2;
        const y1 = ((v1.y + 1) * height) / 2;

        drawLine(ctx, P(x0, y0), P(x1, y1));
      }
    }
  });
</script>

<h1>Bresenham’s Line Drawing Algorithm</h1>

<canvas id="canvas" bind:this={canvas} width="800" height="800" />
