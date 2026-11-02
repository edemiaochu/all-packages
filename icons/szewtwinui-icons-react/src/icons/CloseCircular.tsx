import React, { type SVGProps } from 'react';

const SvgCloseCircular = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11.4 5.4l-.8-.8L8 7.3 5.4 4.6l-.8.8L7.3 8l-2.7 2.6.8.8L8 8.7l2.6 2.7.8-.8L8.7 8z" />
  <path d="M8 1.5c3.6 0 6.5 2.9 6.5 6.5s-2.9 6.5-6.5 6.5S1.5 11.6 1.5 8 4.4 1.5 8 1.5M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" />
</svg>
);

export default SvgCloseCircular;
export { SvgCloseCircular };
