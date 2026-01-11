import { TextEncoder, TextDecoder } from "util";

//@ts-expect-error - the TextEncoder is valid
global.TextEncoder = TextEncoder;
//@ts-expect-error - the TextDecoder is valid
global.TextDecoder = TextDecoder;
