"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDistributeCenterVertical = void 0;
const react_1 = __importDefault(require("react"));
const SvgDistributeCenterVertical = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 4v1h-5v2H5V5H0V4h5V2h6v2zm-3 5H3v2H0v1h3v2h10v-2h3v-1h-3z", fillRule: "evenodd" })));
exports.SvgDistributeCenterVertical = SvgDistributeCenterVertical;
exports.default = SvgDistributeCenterVertical;
