<script>
  let throttle = null;
  let timeout = null;
  let popup = {
    classname: "",
    visible: false,
    persist: false,
    x: 0,
    y: 0,
    width: 400,
    height: 300
  }

  function handleMouseEnter(e) {
    popup.visible = true;
    timeout = setTimeout(() => { 
      timeout = setTimeout(() => { popup.persist = true; }, 4000);
      popup.classname = "popup--draw"; 
    }, 300);
  }

  function handleMouseMove(e) {
    if (throttle || popup.persist) return;

    throttle = requestAnimationFrame(() => {
      throttle = null;
      popup.x = e.clientX + 32;
      popup.y = e.clientY + 32;
      if (popup.x + popup.width > window.innerwidth) {
        popup.x = window.innerwidth - popup.width - 32;
      }
      if (popup.y + popup.height > window.innerheight) {
        popup.y = window.innerheight - popup.height - 32;
      }
    });
  }

  function handleMouseLeave() {
    if (!popup.persist) {
     handleClose();
    }
    clearTimeout(timeout);
    timeout = null;
  }

  function handleClose() {
    popup.classname = "";
    popup.visible = false;
    popup.persist = false;
  }
</script>

<main class="container">
  <h1>Popup inspired by CK3</h1>
  <button 
    on:mouseenter={handleMouseEnter} 
    on:mouseleave={handleMouseLeave} 
    on:mousemove={handleMouseMove} 
    class="btn">
    Hover on me
  </button>

  {#if popup.visible}
  <div class="popup {popup.classname}" style="min-width: {popup.width}px; min-height: {popup.height}px; top: {popup.y}px; left: {popup.x}px">
    <button class="btn" on:click={handleClose}>Close Popup</button>
  </div>
  {/if}
</main>


<style>
  .container {
    margin: 16px;
  }

  .btn {
    --bg: #1447cf;
    margin: 16px;
    cursor: pointer;
    font-size: 32px;
    text-decoration: none;
    background: none;
    border: 2px solid var(--bg);
    outline: 2px solid var(--bg);
    outline-offset: -2px;
    transition: outline-offset 200ms ease;
  }

  .btn:hover {
    outline-offset: 2px;
  }

  .popup {
    position: fixed;
    box-sizing: border-box;
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .popup--hidden {
    display: none;
  }

  .popup::before,
  .popup::after {
    content: '';
    box-sizing: inherit;
    position: absolute;
    border: 2px solid transparent;
    width: 0;
    height: 0;
    z-index: -2;
  }

  .popup--draw::before,
  .popup--draw::after {
    width: 100%;
    height: 100%;
  }

  .popup--draw::before {
    top: 0;
    left: 0;
    border-top-color: red;
    border-right-color: red;
    transition:
      width 1s ease-out, 
      height 1s ease-out 1s; 
  }

  .popup--draw::after {
    bottom: 0;
    right: 0;
    border-bottom-color: red;
    border-left-color: red;
    transition:
      width 1s ease-out 2s,
      height 1s ease-out 3s; 
  }
</style>
