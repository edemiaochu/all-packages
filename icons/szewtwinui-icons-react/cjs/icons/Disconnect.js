"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDisconnect = void 0;
const react_1 = __importDefault(require("react"));
const SvgDisconnect = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 0a8 8 0 108 8 8 8 0 00-8-8M1.5 8a6.46 6.46 0 011.41-4L12 13.09A6.49 6.49 0 011.5 8m11.59 4L4 2.91A6.49 6.49 0 0113.09 12" })));
exports.SvgDisconnect = SvgDisconnect;
exports.default = SvgDisconnect;
