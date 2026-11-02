import React, { type SVGProps } from 'react';

const SvgSelection = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M2 8H1V6h1zm10-8h-2v1h2zM2 3H1v2h1zm12-1h1V0h-2v1h1zm1 1h-1v2h1zm-1 5h1V6h-1zm0 1v.569l1 1.136V9zm-7 2h2v-1H7zM4 1h2V0H4zm3 0h2V0H7zM2 9H1v2h2v-1H2zm2 2h2v-1H4zM1 2h1V1h1V0H1zm9.993 11.994V8.208a.247.247 0 01.053-.146.184.184 0 01.283-.014l3.616 4.109a.229.229 0 01.045.076.234.234 0 01-.11.29l-1.264.572.828 2.273a.24.24 0 01-.11.291l-.723.338h-.08a.186.186 0 01-.18-.132l-.828-2.254-1.264.572a.153.153 0 01-.18 0 .246.246 0 01-.086-.189z" />
</svg>
);

export default SvgSelection;
export { SvgSelection };
