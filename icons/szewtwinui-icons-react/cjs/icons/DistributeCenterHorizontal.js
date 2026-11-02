"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDistributeCenterHorizontal = void 0;
const react_1 = __importDefault(require("react"));
const SvgDistributeCenterHorizontal = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M5 3h2v10H5v3H4v-3H2V3h2V0h1zm9 2h-2V0h-1v5H9v6h2v5h1v-5h2z", fillRule: "evenodd" })));
exports.SvgDistributeCenterHorizontal = SvgDistributeCenterHorizontal;
exports.default = SvgDistributeCenterHorizontal;
