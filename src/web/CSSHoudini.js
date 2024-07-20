/* eslint-disable class-methods-use-this */
// eslint-disable-next-line no-undef
registerPaint(
  'borderDraw',
  class {
    static get inputProperties() {
      return ['--borderWidrh', '--clipPath', '--color'];
    }

    paint(ctx, size, properties) {
      const borderWidrh = properties.get('--borderWidrh');
      const clipPath = properties.get('--clipPath');
      const color = properties.get('--color');
      const { width } = size;
      const { height } = size;
      const paths = clipPath.toString().split(',');
      const cc = obj => {
        const [x, y] = obj;

        let fx = 0;
        let fy = 0;

        if (x.indexOf('%') > -1) {
          fx = (parseFloat(x) / 100) * width;
        } else if (x.indexOf('px') > -1) {
          fx = parseFloat(x);
        }

        if (y.indexOf('%') > -1) {
          fy = (parseFloat(y) / 100) * height;
        } else if (y.indexOf('px') > -1) {
          fy = parseFloat(y);
        }

        return [fx, fy];
      };

      let p = cc(paths[0].trim().split(' '));

      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);

      for (let i = 1; i < paths.length; i++) {
        p = cc(paths[i].trim().split(' '));
        ctx.lineTo(p[0], p[1]);
      }

      ctx.closePath();
      ctx.lineWidth = borderWidrh * 2;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  },
);
