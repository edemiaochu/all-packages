"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgKey = void 0;
const react_1 = __importDefault(require("react"));
const SvgKey = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8.5 6.829l.333-.333L16 13.658v-1L9.03 5.693A4.582 4.582 0 004.583 0 4.581 4.581 0 000 4.58a4.582 4.582 0 005.828 4.408L7 10.16h1.833v1.666H10.5v1.665h1.833v1.832h2.334l.656.677.677-.677v-.999L8.5 6.829zm-5-1.832a1.5 1.5 0 11-.001-3 1.5 1.5 0 01.001 3z" })));
exports.SvgKey = SvgKey;
exports.default = SvgKey;
