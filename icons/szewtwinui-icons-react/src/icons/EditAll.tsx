import React, { type SVGProps } from 'react';

const SvgEditAll = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M16 6.85a.963.963 0 01-.3.75l-1.35 1.35-3.225-3.375 1.35-1.275a1.087 1.087 0 011.5 0l1.875 1.875a1.791 1.791 0 01.15.675zm-5.4-.75l3.3 3.3L7.3 16H4v-3.3zm-3 8.1l-1.875-1.875-.75.75v.825h1.05v1.05h.825zm3.15-6.675L6.475 11.8a.262.262 0 00-.075.15c0 .15.075.15.15.15s.075 0 .15-.075l4.275-4.275a.262.262 0 00.075-.15c0-.15-.075-.15-.15-.15s-.075 0-.15.075zM2 10V8H0V0h8v2h2v3.7l-1 1V3H3v6h3.7l-1 1zm0-3V2h5V1H1v6z" />
</svg>
);

export default SvgEditAll;
export { SvgEditAll };
