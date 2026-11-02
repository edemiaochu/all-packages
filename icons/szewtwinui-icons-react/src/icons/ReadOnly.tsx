import React, { type SVGProps } from 'react';

const SvgReadOnly = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M15.8 2.9L13.3.4a1.284 1.284 0 00-1-.4 1.284 1.284 0 00-1 .4L9.5 2.1l4.3 4.5 1.8-1.8a1.284 1.284 0 00.4-1 2.388 2.388 0 00-.2-.9zM6 8.3l-2.4 2.4c-.1.1-.1.1-.2.1s-.2 0-.2-.2a.35.35 0 01.1-.2L5.7 8 4.6 7 0 11.6V16h4.4L9 11.4zm-2.2 6.3H2.7v-1.4H1.3v-1.1l1-1 2.5 2.5zm5-11.8L7 4.6l1 1.1.9-1c.1-.1.1-.1.2-.1s.2 0 .2.2a.139.139 0 010 .2l-1 1 3.1 3 1.8-1.8zM.151 1.283L1.211.222l14.496 14.495-1.06 1.061z" />
</svg>
);

export default SvgReadOnly;
export { SvgReadOnly };
