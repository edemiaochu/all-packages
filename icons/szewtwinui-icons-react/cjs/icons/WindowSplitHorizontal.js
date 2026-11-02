"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgWindowSplitHorizontal = void 0;
const react_1 = __importDefault(require("react"));
const SvgWindowSplitHorizontal = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M0 0v16h16V0H0m14 1h1v1h-1V1m-2 0h1v1h-1V1m3 3v5H1V4h14M1 15v-5h14v5H1" })));
exports.SvgWindowSplitHorizontal = SvgWindowSplitHorizontal;
exports.default = SvgWindowSplitHorizontal;
