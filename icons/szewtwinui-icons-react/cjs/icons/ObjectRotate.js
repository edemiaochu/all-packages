"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgObjectRotate = void 0;
const react_1 = __importDefault(require("react"));
const SvgObjectRotate = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M12.979 8.322L11.648 6.99l.665-.666-2.33-.332.334 2.329.665-.666 1.331 1.331zm-6.99-6.908l2.58 2.579-4.576 4.575L1.414 5.99 5.99 1.414M5.99 0L0 5.99l3.993 3.993 5.99-5.99zM7 10h1v1H7zm2 0h2v1H9zm3 0h2v1h-2zm3 0h1v1h-1zm-8 5h1v1H7zm2 0h2v1H9zm3 0h2v1h-2zm3 0h1v1h-1zm-8-3h1v2H7zm8 0h1v2h-1z", fillRule: "evenodd" })));
exports.SvgObjectRotate = SvgObjectRotate;
exports.default = SvgObjectRotate;
