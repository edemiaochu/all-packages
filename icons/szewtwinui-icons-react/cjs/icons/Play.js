"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPlay = void 0;
const react_1 = __importDefault(require("react"));
const SvgPlay = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M5 3a1 1 0 00-1 1v8a1 1 0 001.496.868l7-4a1 1 0 000-1.736l-7-4A.999.999 0 005 3z" })));
exports.SvgPlay = SvgPlay;
exports.default = SvgPlay;
