"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgBolt = void 0;
const react_1 = __importDefault(require("react"));
const SvgBolt = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13.42 6.5v-.01a.602.602 0 00-.53-.31H9.68L11.24.74a.571.571 0 00-.31-.679.603.603 0 00-.72.15L2.66 8.85a.591.591 0 00-.08.66.603.603 0 00.53.32h3.21l-1.57 5.43a.59.59 0 00.35.689.419.419 0 00.2.05h.03a.571.571 0 00.46-.21l7.55-8.639a.577.577 0 00.08-.65z" })));
exports.SvgBolt = SvgBolt;
exports.default = SvgBolt;
