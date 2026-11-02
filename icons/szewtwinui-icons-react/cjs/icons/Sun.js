"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSun = void 0;
const react_1 = __importDefault(require("react"));
const SvgSun = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8.063 4.899A3.122 3.122 0 114.941 8.02a3.126 3.126 0 013.122-3.122m0-1a4.122 4.122 0 104.122 4.122 4.127 4.127 0 00-4.122-4.122zm0-.896a.52.52 0 00.518-.518V.518A.52.52 0 008.063 0a.52.52 0 00-.518.518v1.966a.519.519 0 00.518.518zM4.51 4.421a.52.52 0 000-.732L3.12 2.3a.519.519 0 00-.732 0 .519.519 0 000 .732l1.39 1.39a.52.52 0 00.732 0zM3.002 7.937a.52.52 0 00-.518-.518H.518A.52.52 0 000 7.937a.52.52 0 00.518.518h1.966a.519.519 0 00.518-.518zm1.419 3.553a.52.52 0 00-.732 0L2.3 12.88a.519.519 0 000 .732.519.519 0 00.732 0l1.39-1.39a.52.52 0 000-.732zm3.516 1.508a.52.52 0 00-.518.518v1.966a.52.52 0 00.518.518.52.52 0 00.518-.518v-1.966a.519.519 0 00-.518-.518zm3.553-1.419a.52.52 0 000 .732l1.39 1.39a.519.519 0 00.732 0 .519.519 0 000-.732l-1.39-1.39a.52.52 0 00-.732 0zm1.508-3.516a.52.52 0 00.518.518h1.966A.52.52 0 0016 8.063a.52.52 0 00-.518-.518h-1.966a.519.519 0 00-.518.518zM11.579 4.51a.52.52 0 00.732 0l1.39-1.39a.519.519 0 000-.732.519.519 0 00-.732 0l-1.39 1.39a.52.52 0 000 .732z" })));
exports.SvgSun = SvgSun;
exports.default = SvgSun;
