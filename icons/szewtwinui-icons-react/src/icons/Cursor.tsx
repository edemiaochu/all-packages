import React, { type SVGProps } from 'react';

const SvgCursor = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M4.17 11.83a.34.34 0 00.36 0l2.52-1 1.65 3.94a.37.37 0 00.36.23h.16l1.44-.59a.4.4 0 00.22-.51L9.23 9.93l2.52-1a.39.39 0 00.13-.64L4.67 1.11a.4.4 0 00-.67.28V11.5a.41.41 0 00.17.33z" />
</svg>
);

export default SvgCursor;
export { SvgCursor };
