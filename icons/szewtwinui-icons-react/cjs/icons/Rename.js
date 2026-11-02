"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgRename = void 0;
const react_1 = __importDefault(require("react"));
const SvgRename = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13 3h-2v1h5V3h-2v10h2v-1h-5v1h2zM3 7h4a1 1 0 010 2H3a1 1 0 010-2zm8 3H1V6h10V5H1a1 1 0 00-1 1v4a1 1 0 001 1h10z" })));
exports.SvgRename = SvgRename;
exports.default = SvgRename;
