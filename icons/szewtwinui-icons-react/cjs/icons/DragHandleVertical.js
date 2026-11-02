"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDragHandleVertical = void 0;
const react_1 = __importDefault(require("react"));
const SvgDragHandleVertical = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7 4a1 1 0 11-2 0 1 1 0 012 0zM6 7a1 1 0 100 2 1 1 0 000-2zm0 4a1 1 0 100 2 1 1 0 000-2zm5-7a1 1 0 11-2 0 1 1 0 012 0zm-1 3a1 1 0 100 2 1 1 0 000-2zm0 4a1 1 0 100 2 1 1 0 000-2z" })));
exports.SvgDragHandleVertical = SvgDragHandleVertical;
exports.default = SvgDragHandleVertical;
