import React, { type SVGProps } from 'react';

const SvgAnnotation = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M13.5 2h-11A1.5 1.5 0 001 3.5v6A1.5 1.5 0 002.5 11H5v3l3-3h5.5A1.5 1.5 0 0015 9.5v-6A1.5 1.5 0 0013.5 2zm-6 7h-4a.5.5 0 010-1h4a.5.5 0 010 1zm5-2h-9a.5.5 0 010-1h9a.5.5 0 010 1zm0-2h-9a.5.5 0 010-1h9a.5.5 0 010 1z" fillRule="evenodd" />
</svg>
);

export default SvgAnnotation;
export { SvgAnnotation };
