"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgChevronRightSmall = void 0;
const react_1 = __importDefault(require("react"));
const SvgChevronRightSmall = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M5.525 2l-1.05 1.05L9.425 8l-4.95 4.95L5.525 14l6-6-6-6z" })));
exports.SvgChevronRightSmall = SvgChevronRightSmall;
exports.default = SvgChevronRightSmall;
