"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFitToView = void 0;
const react_1 = __importDefault(require("react"));
const SvgFitToView = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15 1v14H1V1zm1-1H0v16h16zM5.4 2H2v3.4zM14 5.4V2h-3.4zM10.6 14H14v-3.4zM2 10.6V14h3.4z" })));
exports.SvgFitToView = SvgFitToView;
exports.default = SvgFitToView;
