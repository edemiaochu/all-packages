"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCheckboxSelect = void 0;
const react_1 = __importDefault(require("react"));
const SvgCheckboxSelect = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M1.994 0v1h13v13h1L16.006.01 1.994 0zm12 16h-14V2h14zm-13-1h12V3h-12zm4.988-5.187L4.1 7.958l-1.116 1.1 3 2.955 4.999-4.925-1.116-1.1z" })));
exports.SvgCheckboxSelect = SvgCheckboxSelect;
exports.default = SvgCheckboxSelect;
