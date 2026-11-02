"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFolder = void 0;
const react_1 = __importDefault(require("react"));
const SvgFolder = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M1 13a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1H7V3a1 1 0 00-1-1H2a1 1 0 00-1 1z" })));
exports.SvgFolder = SvgFolder;
exports.default = SvgFolder;
