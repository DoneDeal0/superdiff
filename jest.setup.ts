import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
//@ts-expect-error - the TextDecoder is valid
global.TextDecoder = TextDecoder;
