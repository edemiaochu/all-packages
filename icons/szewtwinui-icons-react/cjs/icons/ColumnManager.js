"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgColumnManager = void 0;
const react_1 = __importDefault(require("react"));
const SvgColumnManager = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M1 0h2v16H1M7 0h2v16H7m6-16h2v16h-2" })));
exports.SvgColumnManager = SvgColumnManager;
exports.default = SvgColumnManager;
