"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgChevronRight = void 0;
const react_1 = __importDefault(require("react"));
const SvgChevronRight = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M4.7 0L3.3 1.4 9.9 8l-6.6 6.6L4.7 16l8-8z" })));
exports.SvgChevronRight = SvgChevronRight;
exports.default = SvgChevronRight;
