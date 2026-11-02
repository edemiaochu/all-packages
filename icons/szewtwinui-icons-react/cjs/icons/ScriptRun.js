"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgScriptRun = void 0;
const react_1 = __importDefault(require("react"));
const SvgScriptRun = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M12.817 2.56c.202-2.097.737-1.95.737-1.95A6.966 6.966 0 0114 2.56zM8.89 7a1.97 1.97 0 01.898.216l1.424.732c.357-2.615.81-6.027.81-6.027S12.139.04 13.127 0H4.433S3.405.04 3.168 1.6a806.5 806.5 0 00-.962 6.98h4.817A1.856 1.856 0 018.89 7zM7 9.439H0S.367 12 1.304 12H7zm2.33-1.334l6.222 3.2a.85.85 0 01.33.298.758.758 0 01-.33 1.092l-6.222 3.2a.966.966 0 01-.441.105.848.848 0 01-.889-.8V8.8a.848.848 0 01.889-.8.965.965 0 01.44.105z" })));
exports.SvgScriptRun = SvgScriptRun;
exports.default = SvgScriptRun;
