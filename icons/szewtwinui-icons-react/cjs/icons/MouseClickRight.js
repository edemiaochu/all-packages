"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgMouseClickRight = void 0;
const react_1 = __importDefault(require("react"));
const SvgMouseClickRight = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M9 9h2V8H9zM2 5.5v5a5.5 5.5 0 0011 0v-5a5.5 5.5 0 00-11 0zm5-4.45v1.042A1.496 1.496 0 006 3.5V6H3v-.5a4.49 4.49 0 014-4.45zM7.5 3a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3a.5.5 0 01.5-.5zM3 10.5V7h3.092a1.492 1.492 0 002.816 0H12v3.5a4.5 4.5 0 01-9 0z" })));
exports.SvgMouseClickRight = SvgMouseClickRight;
exports.default = SvgMouseClickRight;
