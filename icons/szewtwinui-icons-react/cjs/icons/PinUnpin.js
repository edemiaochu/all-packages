"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPinUnpin = void 0;
const react_1 = __importDefault(require("react"));
const SvgPinUnpin = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M9.97 12.535a4.79 4.79 0 01-1.158 1.437l-2.94-2.941L.903 16H0v-.903l4.969-4.969-2.942-2.941c.406-.486.898-.87 1.437-1.157l6.506 6.505zM7.385 5L11 8.615l1.663-1.663c.095.007.19.014.287.014A3.905 3.905 0 0016 5.501L10.5 0a3.905 3.905 0 00-1.466 3.051c0 .097.007.192.014.287L7.385 5.001zm7.252 10.787l1.06-1.061L1.201.232l-1.06 1.06 14.496 14.496z" })));
exports.SvgPinUnpin = SvgPinUnpin;
exports.default = SvgPinUnpin;
