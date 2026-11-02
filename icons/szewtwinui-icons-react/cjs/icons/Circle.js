"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCircle = void 0;
const react_1 = __importDefault(require("react"));
const SvgCircle = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 2.5A5.5 5.5 0 112.5 8 5.506 5.506 0 018 2.5M8 1a7 7 0 107 7 7 7 0 00-7-7z" })));
exports.SvgCircle = SvgCircle;
exports.default = SvgCircle;
