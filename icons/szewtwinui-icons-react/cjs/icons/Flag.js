"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFlag = void 0;
const react_1 = __importDefault(require("react"));
const SvgFlag = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M5.472 15.978a.616.616 0 01-.756-.466L1.521 2.845a.66.66 0 01.437-.803.615.615 0 01.755.465l3.194 12.667a.662.662 0 01-.435.804zm7.159-8.09a6.694 6.694 0 01-1.834.183c-.602-.009-1.197-.05-1.8-.057a6.743 6.743 0 00-1.831.184 3.595 3.595 0 00-1.871 1.156l-.592-2.345-.516-2.043c-.175-.699-.365-1.446-.59-2.344a3.6 3.6 0 011.87-1.157 6.645 6.645 0 011.834-.18c.601.006 1.196.047 1.798.053a6.608 6.608 0 001.833-.181A3.606 3.606 0 0012.803 0l.592 2.343c.175.699.34 1.347.516 2.044l.589 2.346a3.616 3.616 0 01-1.87 1.156z", fillRule: "evenodd" })));
exports.SvgFlag = SvgFlag;
exports.default = SvgFlag;
