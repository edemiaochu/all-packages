"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPerspective = void 0;
const react_1 = __importDefault(require("react"));
const SvgPerspective = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8.32 0L0 1.92l3.2 8.32L9 16l3.84-5.76 3.2-9zm0 1.22l6 1L8.47 5 1.79 2.74zM2 3.87l6 2 .34 7.83-4.11-4.13zm9.72 5.83l-2.38 3.55L9 5.82l4.91-2.27z" })));
exports.SvgPerspective = SvgPerspective;
exports.default = SvgPerspective;
