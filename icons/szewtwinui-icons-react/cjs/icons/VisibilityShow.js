"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgVisibilityShow = void 0;
const react_1 = __importDefault(require("react"));
const SvgVisibilityShow = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 2.99a8.819 8.819 0 00-8 4.951 8.747 8.747 0 008 5.068 8.633 8.633 0 008-5.068 8.836 8.836 0 00-8-4.95zM6.686 4.86a1.477 1.477 0 11-1.477 1.477A1.477 1.477 0 016.686 4.86zM8 11.51a7.175 7.175 0 01-6.305-3.553A7.495 7.495 0 014.51 5.324a3.84 3.84 0 106.981.002 7.522 7.522 0 012.818 2.64A7.098 7.098 0 018 11.508z" })));
exports.SvgVisibilityShow = SvgVisibilityShow;
exports.default = SvgVisibilityShow;
