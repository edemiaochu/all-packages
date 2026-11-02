"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPlayBackward = void 0;
const react_1 = __importDefault(require("react"));
const SvgPlayBackward = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M11 3a1 1 0 011 1v8a1 1 0 01-1.496.868l-7-4a1 1 0 010-1.736l7-4A.999.999 0 0111 3z" })));
exports.SvgPlayBackward = SvgPlayBackward;
exports.default = SvgPlayBackward;
