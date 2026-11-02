import React, { type SVGProps } from 'react';

const SvgUpload = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M2 5h4v7h4V5h4L8 0zm12 6v3H2v-3H0v5h16v-5z" />
</svg>
);

export default SvgUpload;
export { SvgUpload };
