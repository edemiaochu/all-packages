"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgStatusPending = void 0;
const react_1 = __importDefault(require("react"));
const SvgStatusPending = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7.91 0a8 8 0 108 8 8 8 0 00-8-8zm3.235 10.924L6.909 8.277V4h1v3.723l3.765 2.353z" })));
exports.SvgStatusPending = SvgStatusPending;
exports.default = SvgStatusPending;
