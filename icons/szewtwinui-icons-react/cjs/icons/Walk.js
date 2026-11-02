"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgWalk = void 0;
const react_1 = __importDefault(require("react"));
const SvgWalk = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14.112 12.308l-3.6-.3a3.51 3.51 0 00-.6 1.8 1.743 1.743 0 001.4 2.1h.3a2.061 2.061 0 002.3-1.9 4.678 4.678 0 00.2-1.7m1.9-6.6a6.632 6.632 0 01-.5 2.8 13.442 13.442 0 01-1.2 2.4l-3.5-.3a6.478 6.478 0 00-.2-2 23.254 23.254 0 01-.5-2.8 4.678 4.678 0 01.5-2.6 2.217 2.217 0 012.4-1.3 3.754 3.754 0 013 3.8m-14.1 4.7l3.5-.3a2.792 2.792 0 01.6 1.8 1.743 1.743 0 01-1.4 2.1h-.3a2.061 2.061 0 01-2.3-1.9 9.15 9.15 0 01-.1-1.7m-1.9-6.6a6.632 6.632 0 00.5 2.8l1.2 2.4 3.5-.3a6.478 6.478 0 01.2-2 23.254 23.254 0 00.5-2.8 5.834 5.834 0 00-.6-2.6 2.35 2.35 0 00-2.4-1.3 3.768 3.768 0 00-2.9 3.8" })));
exports.SvgWalk = SvgWalk;
exports.default = SvgWalk;
