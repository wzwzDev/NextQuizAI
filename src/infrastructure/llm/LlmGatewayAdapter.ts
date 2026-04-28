import type { LlmGatewayPort } from "@/application/ports/out/LlmGatewayPort";
import { strict_output } from "@/server/ai/gpt";

export class LlmGatewayAdapter implements LlmGatewayPort {
  async strictOutput(
    systemPrompt: string,
    userPrompt: string | string[],
    outputFormat: Record<string, unknown>,
  ): Promise<unknown> {
    return strict_output(systemPrompt, userPrompt, outputFormat);
  }
}
