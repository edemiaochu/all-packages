"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCalendar = void 0;
const react_1 = __importDefault(require("react"));
const SvgCalendar = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13 13H9v-3h4zm3-10v12a1 1 0 01-1 1H1a1 1 0 01-1-1V3a1 1 0 011-1h2V0h1v2h8V0h1v2h2a1 1 0 011 1zm-1 3H1v9h14z" })));
exports.SvgCalendar = SvgCalendar;
exports.default = SvgCalendar;
