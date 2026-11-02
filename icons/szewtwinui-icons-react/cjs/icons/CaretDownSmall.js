"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCaretDownSmall = void 0;
const react_1 = __importDefault(require("react"));
const SvgCaretDownSmall = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M4.807 6h6.395a.28.28 0 01.24.443L8.27 9.9a.34.34 0 01-.481 0L4.566 6.443A.27.27 0 014.806 6z" })));
exports.SvgCaretDownSmall = SvgCaretDownSmall;
exports.default = SvgCaretDownSmall;
