"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPolygon = void 0;
const react_1 = __importDefault(require("react"));
const SvgPolygon = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7.7 2.027l6.364 7.954-3.766 4.519H1.501V6.289l6.2-4.263M8 0L0 5.5V16h11l5-6L8 .001" })));
exports.SvgPolygon = SvgPolygon;
exports.default = SvgPolygon;
