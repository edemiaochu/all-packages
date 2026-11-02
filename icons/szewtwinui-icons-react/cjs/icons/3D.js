"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Svg3D = void 0;
const react_1 = __importDefault(require("react"));
const Svg3D = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 7v6l-5 3V8.84M5 7v6l5 3V8.84M10.31 5L5.65 6.11l5 1.89 4.84-1.89" }),
    react_1.default.createElement("path", { d: "M4 6.5a1.2 1.2 0 01.92-1.16l3.8-1.64a1.33 1.33 0 01.28 0V3a11.07 11.07 0 01-4.5 1A11.11 11.11 0 010 3v8.85c0 .54 2.14 1 4 1.14zM4.5 0C7 0 9 .67 9 1.5S7 3 4.5 3 0 2.33 0 1.5 2 0 4.5 0z" })));
exports.Svg3D = Svg3D;
exports.default = Svg3D;
