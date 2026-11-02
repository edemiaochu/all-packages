"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgAddCircular = void 0;
const react_1 = __importDefault(require("react"));
const SvgAddCircular = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm5 9H9v4H7V9H3V7h4V3h2v4h4v2z" })));
exports.SvgAddCircular = SvgAddCircular;
exports.default = SvgAddCircular;
