import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// We create a helper to get the model to ensure it uses the latest env var
const getVisionModel = () => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
};

export async function POST(req: NextRequest) {
    console.log("📸 Vision API request received");

    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing in server environment");
        return NextResponse.json({ error: "Configuração incompleta: GEMINI_API_KEY não encontrada." }, { status: 500 });
    }

    try {
        const body = await req.json();
        let rawImage = body.image;

        if (!rawImage) {
            return NextResponse.json({ error: "Nenhuma imagem recebida." }, { status: 400 });
        }

        // Handle possible data:image/...;base64, prefix
        let mimeType = "image/jpeg";
        if (rawImage.includes(";base64,")) {
            const parts = rawImage.split(";base64,");
            mimeType = parts[0].split(":")[1] || "image/jpeg";
            rawImage = parts[1];
        }

        console.log(`🔍 Processing image: ${mimeType}, length: ${rawImage.length}`);

        const model = getVisionModel();
        const prompt = "How many pills or tablets are in this image? Return ONLY the number as an integer. If you see multiple types, count them all together. If you see none, return 0.";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: rawImage,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text().trim();
        console.log("🤖 Gemini Response:", text);

        const count = parseInt(text.replace(/[^0-9]/g, '')) || 0;
        console.log("🔢 Final Count:", count);

        return NextResponse.json({ count });
    } catch (error: any) {
        console.error("❌ Vision API Error:", error);
        return NextResponse.json({ error: "Erro ao processar imagem: " + error.message }, { status: 500 });
    }
}
