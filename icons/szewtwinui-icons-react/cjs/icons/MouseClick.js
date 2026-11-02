"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgMouseClick = void 0;
const react_1 = __importDefault(require("react"));
const SvgMouseClick = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7.5 0A5.5 5.5 0 002 5.5v5a5.5 5.5 0 0011 0v-5A5.5 5.5 0 007.5 0zM12 5.5V6H9V3.5a1.496 1.496 0 00-1-1.408V1.05a4.49 4.49 0 014 4.45zm-4-2v3a.5.5 0 01-1 0v-3a.5.5 0 011 0zM7 1.05v1.042A1.496 1.496 0 006 3.5V6H3v-.5a4.49 4.49 0 014-4.45zM7.5 15A4.505 4.505 0 013 10.5V7h3.092a1.492 1.492 0 002.816 0H12v3.5A4.505 4.505 0 017.5 15z" })));
exports.SvgMouseClick = SvgMouseClick;
exports.default = SvgMouseClick;
