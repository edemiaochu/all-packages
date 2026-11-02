"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgEllipse = void 0;
const react_1 = __importDefault(require("react"));
const SvgEllipse = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 4.2c3.686 0 6.8 1.74 6.8 3.8s-3.114 3.8-6.8 3.8S1.2 10.06 1.2 8 4.314 4.2 8 4.2M8 3C3.582 3 0 5.239 0 8s3.582 5 8 5 8-2.239 8-5-3.582-5-8-5z" })));
exports.SvgEllipse = SvgEllipse;
exports.default = SvgEllipse;
