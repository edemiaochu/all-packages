"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgIsolate = void 0;
const react_1 = __importDefault(require("react"));
const SvgIsolate = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M9 7h6V1H9zm5-1h-4V2h4zM1 7h6V1H1zm5-1H2V2h4zm3 9h6V9H9zm5-1h-4v-4h4zM1 15h6V9H1z" })));
exports.SvgIsolate = SvgIsolate;
exports.default = SvgIsolate;
