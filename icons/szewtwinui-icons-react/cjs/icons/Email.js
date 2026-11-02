"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgEmail = void 0;
const react_1 = __importDefault(require("react"));
const SvgEmail = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 14V4l-8 6-8-6v10z" }),
    react_1.default.createElement("path", { d: "M0 2h16L8 8z" })));
exports.SvgEmail = SvgEmail;
exports.default = SvgEmail;
