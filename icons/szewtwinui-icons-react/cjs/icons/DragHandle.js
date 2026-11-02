"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDragHandle = void 0;
const react_1 = __importDefault(require("react"));
const SvgDragHandle = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M12 7a1 1 0 110-2 1 1 0 010 2zM9 6a1 1 0 10-2 0 1 1 0 002 0zM5 6a1 1 0 10-2 0 1 1 0 002 0zm7 5a1 1 0 110-2 1 1 0 010 2zm-3-1a1 1 0 10-2 0 1 1 0 002 0zm-4 0a1 1 0 10-2 0 1 1 0 002 0z" })));
exports.SvgDragHandle = SvgDragHandle;
exports.default = SvgDragHandle;
