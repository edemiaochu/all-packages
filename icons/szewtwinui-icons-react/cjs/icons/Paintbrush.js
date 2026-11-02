"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPaintbrush = void 0;
const react_1 = __importDefault(require("react"));
const SvgPaintbrush = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M10.484 7.277a1.413 1.413 0 01-.921-1.405L10.375 2a2 2 0 00-4 0l.812 3.872a1.413 1.413 0 01-.921 1.405L3.375 8v1h10V8zM13.375 10s1 4-1 6h-6.57v-1.44L5.135 16h-1.37a1.946 1.946 0 00.26-1.79A2.97 2.97 0 012.635 16H.375s3-1 3-6z" })));
exports.SvgPaintbrush = SvgPaintbrush;
exports.default = SvgPaintbrush;
