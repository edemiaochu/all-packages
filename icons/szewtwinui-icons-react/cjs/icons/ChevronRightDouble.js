"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgChevronRightDouble = void 0;
const react_1 = __importDefault(require("react"));
const SvgChevronRightDouble = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M1.4 0L0 1.4 6.6 8 0 14.6 1.4 16l8-8zM8 0L6.6 1.4 13.2 8l-6.6 6.6L8 16l8-8z" })));
exports.SvgChevronRightDouble = SvgChevronRightDouble;
exports.default = SvgChevronRightDouble;
