"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgAlignRight = void 0;
const react_1 = __importDefault(require("react"));
const SvgAlignRight = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14 0h-1v16h1zm-2 9H1v4h11zm0-6H5v4h7z", fillRule: "evenodd" })));
exports.SvgAlignRight = SvgAlignRight;
exports.default = SvgAlignRight;
