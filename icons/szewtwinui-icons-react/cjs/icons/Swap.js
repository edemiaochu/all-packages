"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSwap = void 0;
const react_1 = __importDefault(require("react"));
const SvgSwap = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M5 15l-3.781-3.5L5 8v2h8v3H5zm6-7l3.781-3.5L11 1v2H3v3h8z" })));
exports.SvgSwap = SvgSwap;
exports.default = SvgSwap;
