<script>
  let errorMessage = '';
  let resultMessage = '';

  const wrap = (fn) => async () => {
    errorMessage = "";
    try {
      const res = await fn();

      resultMessage = await res.text();
    } catch (e) {
      errorMessage = e.stach || e.message
    }
  }
  const sameOriginGet = wrap(() => fetch('/get'));
  const corsGet = wrap(() => fetch('http://localhost:3002/get'));
  const corsGetWithCookie = wrap(() => fetch('http://localhost:3002/get', {credentials: 'include'}));
  const sameOriginPost = wrap(() => fetch('/post', {method: 'POST'}));
  const corsPost = wrap(() => fetch('http://localhost:3002/post', {method: 'POST'}));
  const corsPostWithCookie = wrap(() => fetch('http://localhost:3002/post', {method: 'POST', credentials: 'include'}));
</script>

<main class="container">
  <button on:click={sameOriginGet}>同源GET</button>
  <button on:click={corsGet}>跨域GET</button>
  <button on:click={corsGetWithCookie}>跨域GET带Cookie</button>
  <button on:click={sameOriginPost}>同源POST</button>
  <button on:click={corsPost}>跨域POST</button>
  <button on:click={corsPostWithCookie}>跨域POST带Cookie</button>
  <div class="error">{errorMessage}</div>
  <div class="result">{resultMessage}</div>
</main>

<style>
  .container {
    margin: 16px;
  }

  .error {
    color: red;
  }
</style>
