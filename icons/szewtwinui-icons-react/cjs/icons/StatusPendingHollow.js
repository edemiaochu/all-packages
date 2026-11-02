"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgStatusPendingHollow = void 0;
const react_1 = __importDefault(require("react"));
const SvgStatusPendingHollow = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7.6 4v4.1l3.7 2.2.7-1-3.2-2V4zM8 1.5a6.487 6.487 0 11-.026 0H8M8 0a8 8 0 108 8 8.024 8.024 0 00-8-8z" })));
exports.SvgStatusPendingHollow = SvgStatusPendingHollow;
exports.default = SvgStatusPendingHollow;
