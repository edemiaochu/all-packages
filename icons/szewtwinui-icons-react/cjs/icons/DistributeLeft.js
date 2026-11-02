"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDistributeLeft = void 0;
const react_1 = __importDefault(require("react"));
const SvgDistributeLeft = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M3 3h4v10H3v3H2V0h1zm11 2h-4V0H9v16h1v-5h4z", fillRule: "evenodd" })));
exports.SvgDistributeLeft = SvgDistributeLeft;
exports.default = SvgDistributeLeft;
