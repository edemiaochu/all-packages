"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCloseSmall = void 0;
const react_1 = __importDefault(require("react"));
const SvgCloseSmall = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M12.5 2L8 6.5 3.5 2 2 3.5 6.5 8 2 12.5 3.5 14 8 9.5l4.5 4.5 1.5-1.5L9.5 8 14 3.5z" })));
exports.SvgCloseSmall = SvgCloseSmall;
exports.default = SvgCloseSmall;
