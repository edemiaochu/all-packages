import React, { type SVGProps } from 'react';

const SvgMap = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11.2 11.4L9.7 16H16v-3.2zm.5-1.6l4.3 1.3V0h-1.2zM5 4.2a1.7 1.7 0 11-1.7 1.7A1.7 1.7 0 015 4.2zM0 0v16h8l5.1-16zm6.8 9.5C6.1 10.7 5 12.4 5 12.4a28.866 28.866 0 01-1.8-2.9 7.89 7.89 0 01-1.4-3.6A3.16 3.16 0 015 2.7a3.16 3.16 0 013.2 3.2 7.89 7.89 0 01-1.4 3.6" />
</svg>
);

export default SvgMap;
export { SvgMap };
