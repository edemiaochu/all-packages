"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgLayers = void 0;
const react_1 = __importDefault(require("react"));
const SvgLayers = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 4.8L8 .5 0 4.8l8 4.3zm-8 5.8L1.5 7.1 0 7.9l8 4.3 8-4.3-1.5-.8zm0 3l-6.5-3.5-1.5.8 8 4.3 8-4.3-1.5-.8z" })));
exports.SvgLayers = SvgLayers;
exports.default = SvgLayers;
