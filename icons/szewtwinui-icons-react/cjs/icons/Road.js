"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgRoad = void 0;
const react_1 = __importDefault(require("react"));
const SvgRoad = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13 0h1v15h-1M3 0v15h9V0zm5 14H7v-3h1zm0-5H7V6h1zm0-5H7V1h1zM1 0h1v15H1" })));
exports.SvgRoad = SvgRoad;
exports.default = SvgRoad;
