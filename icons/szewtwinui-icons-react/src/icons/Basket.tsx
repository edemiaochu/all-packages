import React, { type SVGProps } from 'react';

const SvgBasket = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M15.3 6.008h-4.5l-1.3-2.9c-.1-.3-.5-.2-.6 0l-.329.877a.627.627 0 00.018.483l.711 1.54H6.9l1.8-4c.103-.208.13-.346-.056-.533A2.751 2.751 0 008 1.037c-.3-.1-.5-.029-.6.171l-2.1 4.8H.8a.789.789 0 00-.8.8v.2a.789.789 0 00.8.8H1l1.3 6.7a.56.56 0 00.6.5h10.2a.56.56 0 00.6-.5l1.3-6.7h.2a.789.789 0 00.8-.8v-.2a.76.76 0 00-.7-.8m-9.9 6.7a.472.472 0 01-.5.5.472.472 0 01-.5-.5v-3.1a.472.472 0 01.5-.5.472.472 0 01.5.5v3.1m3.2 0a.5.5 0 01-1 0v-3.1a.5.5 0 011 0v3.1m3.2 0a.5.5 0 01-1 0v-3.1a.5.5 0 011 0v3.1" />
</svg>
);

export default SvgBasket;
export { SvgBasket };
