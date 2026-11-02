"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgAlignCenterVertical = void 0;
const react_1 = __importDefault(require("react"));
const SvgAlignCenterVertical = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { fillRule: "evenodd", d: "M16 7h-3V4H9v3H7V2H3v5H0v1h3v5h4V8h2v3h4V8h3V7z" })));
exports.SvgAlignCenterVertical = SvgAlignCenterVertical;
exports.default = SvgAlignCenterVertical;
