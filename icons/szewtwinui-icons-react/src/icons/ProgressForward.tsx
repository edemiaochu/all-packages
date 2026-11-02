import React, { type SVGProps } from 'react';

const SvgProgressForward = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M5.57 15.5l-1.756-1.756L9.558 8 3.814 2.256 5.57.5l7.5 7.5z" />
</svg>
);

export default SvgProgressForward;
export { SvgProgressForward };
