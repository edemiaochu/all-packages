"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgThumbnails = void 0;
const react_1 = __importDefault(require("react"));
const SvgThumbnails = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M9 0h7v7H9zm0 9h7v7H9zM0 9h7v7H0zm0-9h7v7H0z" })));
exports.SvgThumbnails = SvgThumbnails;
exports.default = SvgThumbnails;
