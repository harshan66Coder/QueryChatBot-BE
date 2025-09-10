import fetch from "node-fetch";

export async function getEmbedding(text, apiKey, model = "deepseek/deepseek-embed") {
    const resp = await fetch("https://openrouter.ai/v1/embeddings", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, input: text }), 
    });

    const bodyText = await resp.text();
    try {
        const data = JSON.parse(bodyText);
        return data?.data?.[0]?.embedding || [];
    } catch (err) {
        console.error("Embedding parse error:", err, bodyText);
        return [];
    }
}

export async function generateLLMResponse(messages, apiKey, model = "deepseek/deepseek-chat", max_tokens = 500, temperature = 0.2) {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, max_tokens, temperature }),
    });

    const textResp = await resp.text();
    try {
        return JSON.parse(textResp)?.choices?.[0]?.message?.content || textResp;
    } catch {
        return textResp;
    }
}
