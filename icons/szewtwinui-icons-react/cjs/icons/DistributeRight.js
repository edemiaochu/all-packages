"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDistributeRight = void 0;
const react_1 = __importDefault(require("react"));
const SvgDistributeRight = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14 0v16h-1v-5H9V5h4V0zM6 3H2v10h4v3h1V0H6z", fillRule: "evenodd" })));
exports.SvgDistributeRight = SvgDistributeRight;
exports.default = SvgDistributeRight;
