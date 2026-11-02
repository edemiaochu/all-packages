"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCut = void 0;
const react_1 = __importDefault(require("react"));
const SvgCut = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M12.5 11a2.49 2.49 0 00-1.8.77 4.67 4.67 0 00-.59-.38c-.33-.17-.53-.71-.89-1.39a4.49 4.49 0 00.55-.69c.74-1.16 4.43-7.06 4.93-7.86S14.89.24 14.55 0c0 0-6.34 8.27-6.55 8-1.68-2.11-6.55-8-6.55-8-.34.24-.66.65-.15 1.45s4.18 6.7 4.93 7.86a4.49 4.49 0 00.55.69c-.36.68-.56 1.22-.89 1.39a4.67 4.67 0 00-.59.38 2.5 2.5 0 10.4 2.89v-.1l.06-.12a17.51 17.51 0 011.51-2.7 4.59 4.59 0 01.73-.68 4.54 4.54 0 01.68.67 17.55 17.55 0 011.51 2.73l.07.15A2.5 2.5 0 1012.5 11zm-9 4A1.5 1.5 0 115 13.5 1.5 1.5 0 013.5 15zm9 0a1.5 1.5 0 111.5-1.5 1.5 1.5 0 01-1.5 1.5z" })));
exports.SvgCut = SvgCut;
exports.default = SvgCut;
