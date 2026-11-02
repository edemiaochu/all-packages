"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgWindowFullScreen = void 0;
const react_1 = __importDefault(require("react"));
const SvgWindowFullScreen = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 0v6l-2.2-2.2-3.3 3.3-1.7-1.6 3.3-3.3L10 0zM3.8 2.2l3.3 3.3-1.6 1.7-3.3-3.4L0 6V0h6zm10 10L16 10v6h-6l2.2-2.2-3.3-3.3 1.7-1.7zm-6.6-1.7l-3.3 3.3L6 16H0v-6l2.2 2.2 3.3-3.3z" })));
exports.SvgWindowFullScreen = SvgWindowFullScreen;
exports.default = SvgWindowFullScreen;
