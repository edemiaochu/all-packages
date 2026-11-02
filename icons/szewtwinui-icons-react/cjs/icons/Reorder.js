"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgReorder = void 0;
const react_1 = __importDefault(require("react"));
const SvgReorder = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 32 32", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M26.521 5.849L29 4l-7-1 2 7 1.581-2.977c2.564 1.771 3.924 4.264 3.672 6.906A8.457 8.457 0 0123 21.48V23a10.388 10.388 0 007.747-8.93c.296-3.123-1.296-6.143-4.226-8.221zM5.367 26.15L2.827 28 10 29l-2.05-7-1.62 2.977c-2.628-1.771-4.02-4.264-3.763-6.906a8.514 8.514 0 016.408-7.55V9a10.472 10.472 0 00-7.939 8.93c-.303 3.123 1.328 6.143 4.33 8.221zM19 4.323L17.677 3 16 4.677 14.323 3 13 4.323 14.677 6 13 7.677 14.323 9 16 7.323 17.677 9 19 7.677 17.323 6zm0 10L17.677 13 16 14.677 14.323 13 13 14.323 14.677 16 13 17.677 14.323 19 16 17.323 17.677 19 19 17.677 17.323 16zm0 10L17.677 23 16 24.677 14.323 23 13 24.323 14.677 26 13 27.677 14.323 29 16 27.323 17.677 29 19 27.677 17.323 26z" })));
exports.SvgReorder = SvgReorder;
exports.default = SvgReorder;
