"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDistributeBottom = void 0;
const react_1 = __importDefault(require("react"));
const SvgDistributeBottom = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 6v1H0V6h5V2h6v4zm-3 3H3v4H0v1h16v-1h-3z", fillRule: "evenodd" })));
exports.SvgDistributeBottom = SvgDistributeBottom;
exports.default = SvgDistributeBottom;
