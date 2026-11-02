"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPalette = void 0;
const react_1 = __importDefault(require("react"));
const SvgPalette = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 32 32", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M31.285 5.38c-4.27-5.833-14.41-5.692-22.433-.069C.65 11.061-2.22 20.67 1.926 26.686c4.136 6.002 14.199 5.439 22.434.067 4.384-2.86 4.815-4.466 4.522-6.062-.355-1.942-2.223-1.967-2.617-4.608-.45-3.003 1.664-3.6 4.273-5.738a3.629 3.629 0 00.747-4.965zM7 26a2.784 2.784 0 01-3-2.5A2.784 2.784 0 017 21a2.784 2.784 0 013 2.5A2.784 2.784 0 017 26zm0-8a2.784 2.784 0 01-3-2.5A2.784 2.784 0 017 13a2.784 2.784 0 013 2.5A2.784 2.784 0 017 18zm6-5.992a2.786 2.786 0 01-3-2.504A2.786 2.786 0 0113 7a2.786 2.786 0 013 2.504 2.786 2.786 0 01-3 2.504zM18 6.5A2.785 2.785 0 0121.001 4a2.785 2.785 0 013.002 2.5A2.785 2.785 0 0121 9a2.785 2.785 0 01-3-2.5zM22.017 24a2.785 2.785 0 01-3.001-2.5 2.785 2.785 0 013.001-2.5 2.785 2.785 0 013.001 2.5 2.785 2.785 0 01-3 2.5z" })));
exports.SvgPalette = SvgPalette;
exports.default = SvgPalette;
