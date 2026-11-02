"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFrameForward = void 0;
const react_1 = __importDefault(require("react"));
const SvgFrameForward = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M6.778 4a.76.76 0 00-.39.108A.804.804 0 006 4.8v6.4a.804.804 0 00.387.692.76.76 0 00.777.003l5.444-3.2a.811.811 0 000-1.39l-5.444-3.2A.76.76 0 006.778 4zM4 3a1 1 0 00-1 1v8a1 1 0 001 1 1 1 0 001-1V4a1 1 0 00-1-1z" })));
exports.SvgFrameForward = SvgFrameForward;
exports.default = SvgFrameForward;
