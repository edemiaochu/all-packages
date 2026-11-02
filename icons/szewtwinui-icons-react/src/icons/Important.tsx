import React, { type SVGProps } from 'react';

const SvgImportant = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M6 0h4v3.645l-.773 7.324H6.754L6 3.645zm.138 12.082h3.734V16H6.138z" />
</svg>
);

export default SvgImportant;
export { SvgImportant };
