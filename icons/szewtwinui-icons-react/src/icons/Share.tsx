import React, { type SVGProps } from 'react';

const SvgShare = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11.5 10c-.6 0-1.1.2-1.5.6L5 7.8v-.6l5-2.8c.4.3 1 .6 1.5.6C12.9 5 14 3.9 14 2.5S12.9 0 11.5 0 9 1.1 9 2.5c0 .2 0 .5.1.7L4.4 5.9C3.9 5.3 3.3 5 2.5 5 1.1 5 0 6.1 0 7.5S1.1 10 2.5 10c.8 0 1.4-.3 1.9-.9l4.7 2.7c-.1.2-.1.5-.1.7 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5" fillRule="evenodd" />
</svg>
);

export default SvgShare;
export { SvgShare };
