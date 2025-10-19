import "dotenv/config";
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  try {
    const response = await client.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analyze the letter and provide a summary of the key points.",
            },
            {
              type: "input_file",
              file_url: "https://www.berkshirehathaway.com/letters/2024ltr.pdf",
            },
          ],
        },
      ],
    });

    if (response.output_text) {
      console.log(response.output_text);
    } else {
      // fallback: print structured response
      console.log(JSON.stringify(response, null, 2));
    }
  } catch (err) {
    console.error("Request failed:", err);
    process.exitCode = 1;
  }
})();