"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgLocation = void 0;
const react_1 = __importDefault(require("react"));
const SvgLocation = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 0a5.25 5.25 0 00-5.3 5.2C2.7 8.794 8 16 8 16s5.3-7.106 5.3-10.8A5.316 5.316 0 008 0zm-.097 8a2.7 2.7 0 112.7-2.7 2.7 2.7 0 01-2.7 2.7z" })));
exports.SvgLocation = SvgLocation;
exports.default = SvgLocation;
