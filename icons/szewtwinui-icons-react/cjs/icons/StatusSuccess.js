"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgStatusSuccess = void 0;
const react_1 = __importDefault(require("react"));
const SvgStatusSuccess = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 0a8 8 0 108 8 8 8 0 00-8-8zM6.65 12L3 8.59l1.4-1.3 2.36 2.2L11.59 5 13 6.29z" })));
exports.SvgStatusSuccess = SvgStatusSuccess;
exports.default = SvgStatusSuccess;
