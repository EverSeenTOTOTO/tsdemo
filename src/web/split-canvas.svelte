<script>
  import {onMount} from "svelte";

  let canvas;

  function fetchImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  const loadLeftImage = fetchImage(`${location.origin}/left.png`);
  const loadRightImage = fetchImage(`${location.origin}/right.png`);

  function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left;

    // Log the cursor position
    const ctx = canvas.getContext("2d");

    clearCanvas(ctx);
    drawLine(ctx, x, 0, x, rect.height);
    loadLeftImage.then((image) => {
      drawImage(ctx, 0, 0, rect.width, rect.height, image);
    });
    loadRightImage.then((image) => {
      drawImage(ctx, x, 0, rect.width, rect.height, image);
    });
  }

  function drawImage(ctx, x, y, w, h, image) {
    ctx.drawImage(image, x, y, w, h, x, y, w, h);
  }

  function drawRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawLine(ctx, startX, startY, endX, endY) {
    // Draw the line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function clearCanvas(ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  onMount(() => {
    canvas.addEventListener("mousemove", handleMouseMove);
  });
</script>

<canvas bind:this={canvas} width="512" height="1024" />

<style>
  canvas {
    border: 1px solid #000;
    margin: 40px;
  }
</style>
