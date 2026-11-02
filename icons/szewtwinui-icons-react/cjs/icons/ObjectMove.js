"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgObjectMove = void 0;
const react_1 = __importDefault(require("react"));
const SvgObjectMove = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15 9l-1.5-2L12 9h1v2a1.001 1.001 0 01-1 1h-1v1h1a2 2 0 002-2V9zM7 0h9v6H7zm1 1h7v4H8zM0 9h1v1H0zm2 0h2v1H2zm3 0h2v1H5zm3 0h1v1H8zm-8 5h1v1H0zm2 0h2v1H2zm3 0h2v1H5zm3 0h1v1H8zm-8-3h1v2H0zm8 0h1v2H8z", fillRule: "evenodd" })));
exports.SvgObjectMove = SvgObjectMove;
exports.default = SvgObjectMove;
