"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgStatusRejectedHollow = void 0;
const react_1 = __importDefault(require("react"));
const SvgStatusRejectedHollow = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M2.5 9.98h11v-4h-11v4zm1-3h9v2h-9v-2zM11.314 0H4.686L0 4.686v6.628L4.686 16h6.628L16 11.314V4.686L11.314 0zM15 10.9L10.9 15H5.1L1 10.9V5.1L5.1 1h5.8L15 5.1v5.8z" })));
exports.SvgStatusRejectedHollow = SvgStatusRejectedHollow;
exports.default = SvgStatusRejectedHollow;
