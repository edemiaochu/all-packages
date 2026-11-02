"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCheckmark = void 0;
const react_1 = __importDefault(require("react"));
const SvgCheckmark = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M6 14L0 8l2-2 4 4 8-8 2 2L6 14z" })));
exports.SvgCheckmark = SvgCheckmark;
exports.default = SvgCheckmark;
