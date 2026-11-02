"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgChevronLeft = void 0;
const react_1 = __importDefault(require("react"));
const SvgChevronLeft = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M11.3 0l1.4 1.4L6.1 8l6.6 6.6-1.4 1.4-8-8z" })));
exports.SvgChevronLeft = SvgChevronLeft;
exports.default = SvgChevronLeft;
