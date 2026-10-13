import { demoApi } from "../../../../lib/demo-api";

export async function GET(request: Request): Promise<Response> {
  return demoApi(request);
}

export async function POST(request: Request): Promise<Response> {
  return demoApi(request);
}
