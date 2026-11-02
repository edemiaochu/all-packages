import React, { type SVGProps } from 'react';

const SvgLightbulb = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M10 14a2 2 0 01-4 0m.5-2h3a.5.5 0 010 1h-3a.5.5 0 010-1M11 5.5a3.772 3.772 0 00-2.29-3.455.504.504 0 00-.665.25.499.499 0 00.248.66h.003A2.784 2.784 0 019.994 5.5.503.503 0 0011 5.5M8 0a4.998 4.998 0 00-4.156 7.778h-.002l.011.017v.001L6 11h4l2.158-3.222h-.002A4.998 4.998 0 008 0" fillRule="evenodd" />
</svg>
);

export default SvgLightbulb;
export { SvgLightbulb };
