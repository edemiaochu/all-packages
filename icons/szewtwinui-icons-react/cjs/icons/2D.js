"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Svg2D = void 0;
const react_1 = __importDefault(require("react"));
const Svg2D = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M12 5v.5a6.48 6.48 0 01-.18 1.5H14v7H7v-2.18a6.48 6.48 0 01-1.5.18H5v4h11V5z" }),
    react_1.default.createElement("path", { d: "M5.5 2A3.5 3.5 0 112 5.5 3.5 3.5 0 015.5 2m0-2A5.5 5.5 0 1011 5.5 5.5 5.5 0 005.5 0" })));
exports.Svg2D = Svg2D;
exports.default = Svg2D;
