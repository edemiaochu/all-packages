import React, { type SVGProps } from 'react';

const SvgDistributeLeft = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M3 3h4v10H3v3H2V0h1zm11 2h-4V0H9v16h1v-5h4z" fillRule="evenodd" />
</svg>
);

export default SvgDistributeLeft;
export { SvgDistributeLeft };
