import React, { type SVGProps } from 'react';

const SvgSetup = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M14.9 3.6L16 .7l-.7-.7-2.8 1.1-.5 1.5-5.6 5.6a1.654 1.654 0 00-2 .3L.5 12.4a1.634 1.634 0 000 2.4l.7.7a1.634 1.634 0 002.4 0l3.9-3.9a1.843 1.843 0 00.3-2L13.4 4M3.5 7.9l.2-.2A2.935 2.935 0 015.6 7a1.268 1.268 0 01.6.1l1.6-1.6A4.097 4.097 0 005.6.3 4.3 4.3 0 003.1.1L6 3 3 6 .1 3.1A4.006 4.006 0 003 7.9zm7 .4L8.9 9.9a2.854 2.854 0 010 1.3l4.5 4.5a1.39 1.39 0 001.9 0l.4-.4a1.39 1.39 0 000-1.9" />
</svg>
);

export default SvgSetup;
export { SvgSetup };
