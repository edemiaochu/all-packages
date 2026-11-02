"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSpin = void 0;
const react_1 = __importDefault(require("react"));
const SvgSpin = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 3C3.582 3 0 5.239 0 8c0 2.549 3.055 4.649 7 4.957v2.047l4-3-4-3v2.456c-3.285-.287-5.5-1.945-5.5-3.452 0-1.655 2.669-3.5 6.5-3.5s6.5 1.845 6.5 3.5c0 .98-.941 2.024-2.5 2.715v1.611c2.389-.865 4-2.476 4-4.326 0-2.761-3.582-5-8-5" })));
exports.SvgSpin = SvgSpin;
exports.default = SvgSpin;
