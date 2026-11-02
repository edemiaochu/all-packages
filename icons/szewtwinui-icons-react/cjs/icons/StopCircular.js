"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgStopCircular = void 0;
const react_1 = __importDefault(require("react"));
const SvgStopCircular = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 0a8 8 0 108 8 8 8 0 00-8-8m3 11H5V5h6" })));
exports.SvgStopCircular = SvgStopCircular;
exports.default = SvgStopCircular;
