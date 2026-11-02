"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDelete = void 0;
const react_1 = __importDefault(require("react"));
const SvgDelete = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14 1v1H2V1h3l1-1h4l1 1zM3 3h10v12a1 1 0 01-1 1H4a1 1 0 01-1-1zm6 11h1V5H9zm-3 0h1V5H6z" })));
exports.SvgDelete = SvgDelete;
exports.default = SvgDelete;
