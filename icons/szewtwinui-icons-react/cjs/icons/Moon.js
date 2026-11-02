"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgMoon = void 0;
const react_1 = __importDefault(require("react"));
const SvgMoon = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8.406 14.614a6.637 6.637 0 11.339-13.266l.862.046-.47.725a5.39 5.39 0 00-.493.981 5.646 5.646 0 003.226 7.293 5.71 5.71 0 001.75.376l.85.047-.454.72a6.638 6.638 0 01-5.61 3.078zM7.87 2.363a5.64 5.64 0 104.813 9.297A6.645 6.645 0 017.71 2.739a7.26 7.26 0 01.159-.376z" })));
exports.SvgMoon = SvgMoon;
exports.default = SvgMoon;
