"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgMoreVertical = void 0;
const react_1 = __importDefault(require("react"));
const SvgMoreVertical = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 4a2 2 0 112-2 2 2 0 01-2 2zm2 4a2 2 0 10-2 2 2 2 0 002-2zm0 6a2 2 0 10-2 2 2 2 0 002-2z" })));
exports.SvgMoreVertical = SvgMoreVertical;
exports.default = SvgMoreVertical;
