import React, { type SVGProps } from 'react';

const SvgGraphPieChart = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11.9 15.8c2.1-1.1 4-4 4.1-6.7H8.6z" />
  <path d="M0 8.4c0 4 3.3 7.3 7.3 7.3.9 0 1.8-.2 2.6-.5-.1-.2-3-6.7-3-6.7V1.1C3 1.3 0 4.5 0 8.4" />
  <path d="M8.3 0v7.7H16C15.7 3.6 12.4.3 8.3 0" />
</svg>
);

export default SvgGraphPieChart;
export { SvgGraphPieChart };
