"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgWindowCollapse = void 0;
const react_1 = __importDefault(require("react"));
const SvgWindowCollapse = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M9 6.957V1.093l2.1 2.187L14.3 0 16 1.69l-3.3 3.18 2.2 2.087zM0 14.31l3.3-3.28-2.2-2.087H7v5.863L4.9 12.72 1.7 16zm9-5.367h5.9l-2.2 2.087 3.3 3.28L14.3 16l-3.2-3.28L9 14.807zM1.7 0l3.2 3.28L7 1.093v5.864H1.1L3.3 4.87 0 1.69z" })));
exports.SvgWindowCollapse = SvgWindowCollapse;
exports.default = SvgWindowCollapse;
