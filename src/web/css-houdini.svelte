<script>
  if (CSS.paintWorklet) {
    CSS.paintWorklet.addModule('/CSSHoudini.js');
  }
</script>

<div></div>

<style>
  div {
    position: relative;
    width: 200px;
    height: 64px;
    margin: auto;
    clip-path: polygon(var(--clipPath));
    --color: red;
    --clipPath: 85% 0%, 100% 50%, 85% 100%, 0% 100%, 0% 0%;
    --borderWidth: 5;
  }

  div:before {
    content: "";
    position: absolute;
    inset: 0;
    mask: paint(borderDraw);
    -webkit-mask: paint(borderDraw);
    background: var(--color);
  }

  div:hover {
    background: var(--color);
  }
</style>
