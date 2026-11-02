"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCharts = void 0;
const react_1 = __importDefault(require("react"));
const SvgCharts = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M6 8.724A4.458 4.458 0 014.5 9a4.458 4.458 0 01-2.794-.998L5 4.707V.05A4.48 4.48 0 018.24 7H6zM4 4.293V.05A4.456 4.456 0 00.998 7.295zM9 14H7V8h2zm3 0h-2V5h2zm3-4v4h-2v-4zm-9 6h10v-1H6z" })));
exports.SvgCharts = SvgCharts;
exports.default = SvgCharts;
