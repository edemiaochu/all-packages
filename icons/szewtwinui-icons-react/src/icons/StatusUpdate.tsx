import React, { type SVGProps } from 'react';

const SvgStatusUpdate = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8.01 0a8 8 0 108 8 8 8 0 00-8-8zm0 13.7a5.78 5.78 0 01-4.7-2.4l-1.1 1V8.7h3.9l-1.7 1.6a4.35 4.35 0 003.6 1.9 4.296 4.296 0 004.2-3.6h1.4a5.64 5.64 0 01-5.6 5.1zm2.1-6.4l1.5-1.5a3.967 3.967 0 00-3.6-2.1 4.296 4.296 0 00-4.2 3.6h-1.5a5.733 5.733 0 015.7-5 6.065 6.065 0 014.7 2.4l1-1v3.6z" />
</svg>
);

export default SvgStatusUpdate;
export { SvgStatusUpdate };
