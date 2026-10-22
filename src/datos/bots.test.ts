import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { IA_BLOQUEADAS_EXPRESION } from "./bots";

const bloquea = (agente: string) => IA_BLOQUEADAS_EXPRESION.test(agente);

describe("bots de IA", () => {
  it("frena a los que entrenan modelos y a los que leen a pedido desde un chat", () => {
    for (const agente of [
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ChatGPT-User/1.0; +https://openai.com/bot)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
      "Claude-User/1.0 (+https://www.anthropic.com)",
      "Perplexity-User/1.0",
      "CCBot/2.0 (https://commoncrawl.org/faq/)",
      "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)",
      "meta-externalagent/1.1",
    ]) {
      assert.ok(bloquea(agente), agente);
    }
  });

  it("deja entrar a los buscadores (con y sin IA), a las redes y a los navegadores", () => {
    for (const agente of [
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
      "Mozilla/5.0 (compatible; Claude-SearchBot/1.0)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0)",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "WhatsApp/2.24.1",
      "facebookexternalhit/1.1",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
    ]) {
      assert.ok(!bloquea(agente), agente);
    }
  });
});
