<script>
  let progress = 0;
  let timeout;

  timeout = setInterval(() => {
    progress += 0.5;

    if (progress >= 100) {
      progress = 0;
    }
  }, 1000 / 60);
</script>

<main class="container">
  <h1>Pie</h1>

  <div class="pie-simple" style="--percent: {progress};">
      <div class="pie-left"></div>
      <div class="pie-right"></div>
  </div>
</main>


<style>
  .container {
    margin: 16px;
  }

  .pie-simple {
      width: 128px; height: 128px;
      background-color: #eee;
      border-radius: 50%;
      text-align: left;
      overflow: hidden;
  }
  .pie-left,
  .pie-right {
      width: 50%; height: 100%;
      float: left;
      position: relative;
      overflow: hidden;
  }
  .pie-left::before,
  .pie-right::before,
  .pie-right::after {
      content: "";
      position: absolute;
      width: 100%; height: 100%;
      background-color: deepskyblue;
  }
  .pie-left::before {
      left: 100%;
      transform-origin: left;
      transform: rotate(calc(3.6deg * (var(--percent) - 50)));
      opacity: calc(99999 * (var(--percent) - 50));
  }
  .pie-right::before {
      right: 100%;
      transform-origin: right;
      transform: rotate(calc(3.6deg * var(--percent)));
  }
  .pie-right::after {
      opacity: calc(99999 * (var(--percent) - 50));
  }
</style>
