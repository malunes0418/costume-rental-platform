import { generateOpenApiDocument } from "./src/config/openapi";
import * as fs from "fs";

const doc = generateOpenApiDocument();
fs.writeFileSync("openapi.json", JSON.stringify(doc, null, 2));
console.log("openapi.json generated successfully.");
