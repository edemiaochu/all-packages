"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgAlignLeft = void 0;
const react_1 = __importDefault(require("react"));
const SvgAlignLeft = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M1 0h1v16H1zm2 9h11v4H3zm0-6h7v4H3z", fillRule: "evenodd" })));
exports.SvgAlignLeft = SvgAlignLeft;
exports.default = SvgAlignLeft;
