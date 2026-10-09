import { getTopCoins } from "../../../lib/cryptoList";

export async function GET() {                            // runs when the browser visits /api/crypto
  try {
    return Response.json(await getTopCoins(100));        // send the 100 coins as JSON
  } catch (error) {
    console.error(error);                                // the real reason goes to your terminal
    return Response.json({ error: "unavailable" }, { status: 503 }); // "temporarily unavailable"
  }
}