require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
});

function createClient() {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("Missing GROQ_API_KEY");
    }
    return new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1"
    });
}

app.post("/api/summarize", async (req, res) => {
    const transcript = req.body?.transcript?.trim();

    if (!transcript) {
        return res.status(400).json({ error: "Transcript is required." });
    }

    try {
        const client = createClient();

        const response = await client.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: "You summarize transcribed speech. Return ONLY valid JSON with keys: summary, key_points, and action_items. summary must be a concise paragraph. key_points and action_items must each be arrays of short strings. If there are no action items, return an empty array. Do not include markdown or code blocks."
                },
                {
                    role: "user",
                    content: `Transcript:\n${transcript}`
                }
            ],
            temperature: 0.3
        });

        const text = response.choices[0].message.content;
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return res.json(parsed);
    } catch (error) {
        console.error("Summarization error:", error);

        if (error.message === "Missing GROQ_API_KEY") {
            return res.status(500).json({
                error: "Server is missing GROQ_API_KEY. Add it to your .env file."
            });
        }

        return res.status(500).json({
            error: "Failed to generate AI summary."
        });
    }
});

app.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);
});
