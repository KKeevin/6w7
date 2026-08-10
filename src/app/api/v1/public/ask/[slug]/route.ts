import { jsonError, jsonOk } from "@/lib/api";
import { getPublicAskLink } from "@/services/ask-link.service";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/fingerprint";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const ip = await getClientIp();
    await assertRateLimit({
      key: `public-ask-get:${ip}`,
      limit: 60,
      windowMs: 60 * 1000,
      windowLabel: "1 m",
      name: "public-ask-get",
    });
    const link = await getPublicAskLink(slug);
    return jsonOk({ link });
  } catch (error) {
    return jsonError(error);
  }
}
