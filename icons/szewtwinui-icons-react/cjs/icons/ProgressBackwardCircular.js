"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgProgressBackwardCircular = void 0;
const react_1 = __importDefault(require("react"));
const SvgProgressBackwardCircular = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M9.47 3.47l1.06 1.06L7.06 8l3.47 3.47-1.06 1.06L4.939 8 9.47 3.47z" }),
    react_1.default.createElement("path", { d: "M8 14.5A6.5 6.5 0 1114.5 8 6.507 6.507 0 018 14.5M8 16a8 8 0 10-8-8 8 8 0 008 8" })));
exports.SvgProgressBackwardCircular = SvgProgressBackwardCircular;
exports.default = SvgProgressBackwardCircular;
