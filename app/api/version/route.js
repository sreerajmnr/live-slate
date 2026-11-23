import { versionInfo } from "../../../lib/version";

export function GET() {
  return Response.json(versionInfo);
}
