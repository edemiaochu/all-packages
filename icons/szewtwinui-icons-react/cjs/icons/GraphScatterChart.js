"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgGraphScatterChart = void 0;
const react_1 = __importDefault(require("react"));
const SvgGraphScatterChart = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M2 14V0H0v16h16v-2zm3-4.4A1.4 1.4 0 113.6 11 1.4 1.4 0 015 9.6zm0-4.1a1.4 1.4 0 11-1.4 1.4A1.4 1.4 0 015 5.5zm3 3a1.4 1.4 0 11-1.4 1.4A1.4 1.4 0 018 8.5zm1-3.9A1.4 1.4 0 117.6 6 1.4 1.4 0 019 4.6zm4 0A1.4 1.4 0 1111.6 6 1.4 1.4 0 0113 4.6zm-2 2.9a1.4 1.4 0 11-1.4 1.4A1.4 1.4 0 0111 7.5zm0-5.9A1.4 1.4 0 119.6 3 1.4 1.4 0 0111 1.6z" })));
exports.SvgGraphScatterChart = SvgGraphScatterChart;
exports.default = SvgGraphScatterChart;
