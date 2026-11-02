"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCheckmarkSmall = void 0;
const react_1 = __importDefault(require("react"));
const SvgCheckmarkSmall = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M6 13.4L1.3 8.7l1.4-1.4L6 10.6l7.3-7.3 1.4 1.4z" })));
exports.SvgCheckmarkSmall = SvgCheckmarkSmall;
exports.default = SvgCheckmarkSmall;
