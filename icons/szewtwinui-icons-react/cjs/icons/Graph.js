"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgGraph = void 0;
const react_1 = __importDefault(require("react"));
const SvgGraph = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15 14.5L13 13v1H2.4l2.1-3.6 2.1 3.1 2-5 2 3 2.8-6.6 1 .5-.1-3.6L11.5 4l1 .5-2.1 5-2-3-2 5-1.9-2.9L2 12.7V3h1L1.5 1 0 3h1v12h12v1z" })));
exports.SvgGraph = SvgGraph;
exports.default = SvgGraph;
