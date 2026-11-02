"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgMeasure = void 0;
const react_1 = __importDefault(require("react"));
const SvgMeasure = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15.9 4.2L11.8.1c-.1-.1-.4-.1-.5 0L.1 11.2c-.1.1-.1.4 0 .5l4.1 4.1c.1.1.4.1.5 0l11.2-11c.1-.2.1-.4 0-.6M3.9 13L2 11.2l.7-.7 1.9 1.9zm.4-2.3l-.9-1 .7-.7.9 1zm2.4-.5L4.8 8.3l.7-.7 1.9 1.9zm.5-2.3l-1-1 .7-.7.9.9zm2.3-.5L7.6 5.5l.7-.7 1.9 1.9zm.5-2.3l-1-1 .7-.7.9.9zm2.4-.5l-1.9-1.9.6-.7L13 3.9z" })));
exports.SvgMeasure = SvgMeasure;
exports.default = SvgMeasure;
