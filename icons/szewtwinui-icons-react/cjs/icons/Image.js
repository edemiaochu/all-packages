"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgImage = void 0;
const react_1 = __importDefault(require("react"));
const SvgImage = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M10.3 5.9L7.7 9.3 6 7.6 3 11h10z" }),
    react_1.default.createElement("circle", { cx: "4.4", cy: "5.9", r: "1.3" })));
exports.SvgImage = SvgImage;
exports.default = SvgImage;
