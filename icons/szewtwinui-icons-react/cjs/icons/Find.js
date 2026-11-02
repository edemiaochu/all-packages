"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFind = void 0;
const react_1 = __importDefault(require("react"));
const SvgFind = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M9 9v4h6l-1-8h-2V2h1V0H9v3H7V0H3v2h1v3H2l-1 8h6V9zm-9 5h7v2H0m9-2h7v2H9" })));
exports.SvgFind = SvgFind;
exports.default = SvgFind;
