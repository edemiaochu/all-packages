import React, { type SVGProps } from 'react';

const SvgEmail = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M16 14V4l-8 6-8-6v10z" />
  <path d="M0 2h16L8 8z" />
</svg>
);

export default SvgEmail;
export { SvgEmail };
