"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgAlignBottom = void 0;
const react_1 = __importDefault(require("react"));
const SvgAlignBottom = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M0 14h16v-1H0zm3-2h4V1H3zm6 0h4V5H9z", fillRule: "evenodd" })));
exports.SvgAlignBottom = SvgAlignBottom;
exports.default = SvgAlignBottom;
