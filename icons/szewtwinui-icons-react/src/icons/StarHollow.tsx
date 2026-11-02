import React, { type SVGProps } from 'react';

const SvgStarHollow = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 2.825l1.346 2.821.345.723.793.115 3.03.442-2.16 2.098-.563.548.13.775.503 3.02-2.74-1.402-.684-.35-.683.35-2.7 1.381.557-2.97.149-.79-.578-.562-2.174-2.11 2.945-.43.793-.115.345-.723zM7.995.187A.644.644 0 007.4.6L5.3 5l-4.8.7c-.6.1-.6.7-.2 1.1l3.4 3.3-.9 4.8c-.07.496.21.691.522.691A.86.86 0 003.7 15.5L8 13.3l4.3 2.2a.791.791 0 00.353.092.563.563 0 00.547-.692l-.8-4.8 3.5-3.4a.669.669 0 00-.4-1L10.7 5 8.6.6a.679.679 0 00-.605-.413z" />
</svg>
);

export default SvgStarHollow;
export { SvgStarHollow };
