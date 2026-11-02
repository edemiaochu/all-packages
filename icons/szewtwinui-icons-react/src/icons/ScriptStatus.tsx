import React, { type SVGProps } from 'react';

const SvgScriptStatus = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M12 8a4 4 0 104 4 4 4 0 00-4-4zm-.675 6L9.5 12.295l.7-.65 1.18 1.1 2.415-2.245.705.645zM8.221 8.76H2.206c.36-2.725.823-6.195.962-7.126C3.405.041 4.433 0 4.433 0h8.694c-.988.04-1.106 1.96-1.106 1.96s-.345 2.655-.67 5.105A4.957 4.957 0 008.22 8.76zm4.596-6.147c.202-2.14.737-1.99.737-1.99A7.239 7.239 0 0114 2.612zM7.025 12.25H1.304C.367 12.25 0 9.635 0 9.635h7.62A4.944 4.944 0 007 12c0 .086.02.165.025.25z" />
</svg>
);

export default SvgScriptStatus;
export { SvgScriptStatus };
