"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgMerge = void 0;
const react_1 = __importDefault(require("react"));
const SvgMerge = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M9 9.586V6h2L8 1 5 6h2v3.586l-3.707 3.707 1.414 1.414L8 11.414l3.293 3.293 1.414-1.414L9 9.586" })));
exports.SvgMerge = SvgMerge;
exports.default = SvgMerge;
