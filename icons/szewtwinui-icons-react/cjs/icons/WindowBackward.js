"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgWindowBackward = void 0;
const react_1 = __importDefault(require("react"));
const SvgWindowBackward = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M0 0v16h16V0zm12 1h1v1h-1zM1 15V4h14v11zM14 2V1h1v1z" }),
    react_1.default.createElement("path", { d: "M7 12L4 9l3-3v2h5v2H7z" })));
exports.SvgWindowBackward = SvgWindowBackward;
exports.default = SvgWindowBackward;
