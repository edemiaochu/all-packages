"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgLabel = void 0;
const react_1 = __importDefault(require("react"));
const SvgLabel = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14.5 2h-13A1.5 1.5 0 000 3.5v8A1.5 1.5 0 001.5 13h10.32a1.45 1.45 0 001-.42l2.74-2.74a1.45 1.45 0 00.42-1V3.5A1.5 1.5 0 0014.5 2zm.5 7l-1.25 1.25-.5.49L12 12V9.5a.5.5 0 01.5-.5zm0-1h-2.5A1.5 1.5 0 0011 9.5V12H1.5a.5.5 0 01-.5-.5v-8a.5.5 0 01.5-.5h13a.5.5 0 01.5.5zm-2.5-1h-9a.5.5 0 010-1h9a.5.5 0 010 1zM9.61 9H3.39A.45.45 0 013 8.5a.45.45 0 01.39-.5h6.22a.45.45 0 01.39.5.45.45 0 01-.39.5z" })));
exports.SvgLabel = SvgLabel;
exports.default = SvgLabel;
