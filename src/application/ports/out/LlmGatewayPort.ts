export interface LlmGatewayPort {
  strictOutput(
    systemPrompt: string,
    userPrompt: string | string[],
    outputFormat: Record<string, unknown>,
  ): Promise<unknown>;
}
