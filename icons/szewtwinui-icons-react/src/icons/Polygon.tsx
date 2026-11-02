import React, { type SVGProps } from 'react';

const SvgPolygon = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M7.7 2.027l6.364 7.954-3.766 4.519H1.501V6.289l6.2-4.263M8 0L0 5.5V16h11l5-6L8 .001" />
</svg>
);

export default SvgPolygon;
export { SvgPolygon };
