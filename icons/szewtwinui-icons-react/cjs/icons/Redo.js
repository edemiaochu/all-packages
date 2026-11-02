"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgRedo = void 0;
const react_1 = __importDefault(require("react"));
const SvgRedo = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M0 14a9.38 9.38 0 019-9.4V2l7 5.3-7 5.3V10c-4.3 0-6.7 1.8-9 4" })));
exports.SvgRedo = SvgRedo;
exports.default = SvgRedo;
