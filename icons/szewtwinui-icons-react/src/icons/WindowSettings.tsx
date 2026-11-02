import React, { type SVGProps } from 'react';

const SvgWindowSettings = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M1 4h11v3h1V0H0v13h7v-1H1zm10-3h1v1h-1zM9 1h1v1H9zm7 11.712v-1.427l-1.101-.222a3.04 3.04 0 00-.188-.451l.62-.935-1.008-1.01-.933.62a3.02 3.02 0 00-.456-.19l-.22-1.094h-1.427l-.221 1.094a3.01 3.01 0 00-.459.191l-.928-.617-1.01 1.01.62.931a3.024 3.024 0 00-.19.458l-1.094.22v1.428l1.1.221a3.027 3.027 0 00.19.452l-.622.935 1.01 1.01.94-.625a3.025 3.025 0 00.446.186L11.292 16h1.427l.223-1.107a3.024 3.024 0 00.444-.186l.94.625 1.01-1.01-.625-.94a3.028 3.028 0 00.186-.447zm-2.477-.716z" />
</svg>
);

export default SvgWindowSettings;
export { SvgWindowSettings };
