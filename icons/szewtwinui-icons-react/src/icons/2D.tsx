import React, { type SVGProps } from 'react';

const Svg2D = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M12 5v.5a6.48 6.48 0 01-.18 1.5H14v7H7v-2.18a6.48 6.48 0 01-1.5.18H5v4h11V5z" />
  <path d="M5.5 2A3.5 3.5 0 112 5.5 3.5 3.5 0 015.5 2m0-2A5.5 5.5 0 1011 5.5 5.5 5.5 0 005.5 0" />
</svg>
);

export default Svg2D;
export { Svg2D };
