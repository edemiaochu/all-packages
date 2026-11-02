"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgLoop = void 0;
const react_1 = __importDefault(require("react"));
const SvgLoop = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M11.5 4H8V2.6a.61.61 0 00-.277-.519.52.52 0 00-.554-.002l-3.89 2.4a.625.625 0 000 1.042l3.89 2.4a.52.52 0 00.554-.002A.61.61 0 008 7.4V5.897h3.5a2.603 2.603 0 110 5.206h-7a2.592 2.592 0 01-1.6-4.64l-.146-.091A1.618 1.618 0 012 5a1.602 1.602 0 01.033-.258A4.496 4.496 0 004.5 13h7a4.5 4.5 0 000-9z" })));
exports.SvgLoop = SvgLoop;
exports.default = SvgLoop;
