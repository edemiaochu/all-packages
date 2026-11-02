"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgMove = void 0;
const react_1 = __importDefault(require("react"));
const SvgMove = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 8l-3-3v2H9V3h2L8 0 5 3h2v4H3V5L0 8l3 3V9h4v4H5l3 3 3-3H9V9h4v2z" })));
exports.SvgMove = SvgMove;
exports.default = SvgMove;
