<div></div>

<style>
  div {
    margin: 20px;
    width: 400px;
    height: 50px;
    position: relative;
    background: linear-gradient(45deg,
        var(--colorA),
        var(--colorC),
        var(--colorF));
    animation: borderAnimate 5s infinite linear;
  }

  @property --colorA {
    syntax: '<color>';
    inherits: false;
    initial-value: fuchsia;
  }

  @property --colorC {
    syntax: '<color>';
    inherits: false;
    initial-value: #f79188;
  }

  @property --colorF {
    syntax: '<color>';
    inherits: false;
    initial-value: red;
  }

  @keyframes borderAnimate {
    20% {
      --colorA: red;
      --colorC: #a93ee0;
      --colorF: fuchsia;
    }

    40% {
      --colorA: #ff3c41;
      --colorC: #e228a0;
      --colorF: #2e4c96;
    }

    60% {
      --colorA: orange;
      --colorC: green;
      --colorF: teal;
    }

    80% {
      --colorA: #ae63e4;
      --colorC: #0ebeff;
      --colorF: #efc371;
    }
  }
</style>
