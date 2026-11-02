import React, { type SVGProps } from 'react';

const SvgHeart = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M15.98 4.825C16.46 9.205 8 16 8 16S-.46 9.206.02 4.825C.427 1.108 3.369-.006 5.696.979A4.966 4.966 0 018 3.203 4.966 4.966 0 0110.304.98c2.327-.985 5.269.129 5.676 3.846z" />
</svg>
);

export default SvgHeart;
export { SvgHeart };
