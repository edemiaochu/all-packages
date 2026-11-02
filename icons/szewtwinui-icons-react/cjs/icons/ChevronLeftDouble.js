"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgChevronLeftDouble = void 0;
const react_1 = __importDefault(require("react"));
const SvgChevronLeftDouble = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14.6 0L16 1.4 9.4 8l6.6 6.6-1.4 1.4-8-8zM8 0l1.4 1.4L2.8 8l6.6 6.6L8 16 0 8z" })));
exports.SvgChevronLeftDouble = SvgChevronLeftDouble;
exports.default = SvgChevronLeftDouble;
