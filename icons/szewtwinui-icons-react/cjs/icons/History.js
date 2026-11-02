"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgHistory = void 0;
const react_1 = __importDefault(require("react"));
const SvgHistory = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8.4.5a7.564 7.564 0 00-6.6 3.8L0 2v6h5L3 5.5a5.997 5.997 0 115.4 8.6A6.14 6.14 0 012.7 10H1A7.618 7.618 0 108.4.5zM7 5v3.6l4 2.2.5-.9L8 8V5z" })));
exports.SvgHistory = SvgHistory;
exports.default = SvgHistory;
