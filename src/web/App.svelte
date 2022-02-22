<script>
import { onMount } from 'svelte';

let canvas = {
  el: null,
  clazz: "canvas",
  width: window.innerWidth * 0.9,
  height: window.innerHeight * 0.8
};

let scene = {
  repaint() {
    requestAnimationFrame(() => {
      console.log('repaint')
    });
  }
}

// repaint if resized
window.addEventListener("optimizedResize", () => {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.8;
  scene.repaint();
});

onMount(() => {
  canvas.ctx = canvas.el.getContext('2d');
  // repaint at once
  scene.repaint();
});
</script>

{@debug canvas}

<h1 class="title"> Hello Svelte </h1>

<canvas 
  class={canvas.clazz}
  width={canvas.width}
  height={canvas.height}
  bind:this={canvas.el}
>
</canvas>

