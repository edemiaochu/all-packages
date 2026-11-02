"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDistributeTop = void 0;
const react_1 = __importDefault(require("react"));
const SvgDistributeTop = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 2v1h-5v4H5V3H0V2h16zM3 9H0v1h3v4h10v-4h3V9H3z", fillRule: "evenodd" })));
exports.SvgDistributeTop = SvgDistributeTop;
exports.default = SvgDistributeTop;
