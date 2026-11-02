"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPropertiesList = void 0;
const react_1 = __importDefault(require("react"));
const SvgPropertiesList = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15.1 10.8a.736.736 0 01-.8.8h-3.5a.789.789 0 01-.8-.8.736.736 0 01.8-.8h3.5a.789.789 0 01.8.8zm-.8-3.3h-3.5a.752.752 0 10-.1 1.5h3.5a.876.876 0 00.9-.7.789.789 0 00-.8-.8zm-3.6-.9h3.5a.736.736 0 00.8-.8.713.713 0 00-.7-.8h-3.5a.817.817 0 00-.9.8.789.789 0 00.8.8zM9 8a4 4 0 11-4-4 4.012 4.012 0 014 4zM4.5 6c0 .1.1.3.2.3a.483.483 0 00.7 0 1.007 1.007 0 00.1-.3.601.601 0 00-.1-.4.483.483 0 00-.7 0 .758.758 0 00-.2.4zM6 10h-.5V7H4v.5h.5V10H4v.5h2z" })));
exports.SvgPropertiesList = SvgPropertiesList;
exports.default = SvgPropertiesList;
