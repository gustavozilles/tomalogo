import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";

export async function POST(req: NextRequest) {
    const { to } = await req.json();

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const twiml = new VoiceResponse();
    twiml.pause({ length: 2 });

    const gather = twiml.gather({
        numDigits: 1,
        timeout: 10,
    });

    gather.say({ voice: 'alice', language: 'pt-BR' },
        `Olá! Este é um teste do Toma-Logo-Bot. Para testar as opções: Digite 1 se você tomou o remédio, 2 para adiar ou 3 para descartar. Isso não afetará seu estoque real neste teste.`
    );

    twiml.say({ voice: 'alice', language: 'pt-BR' }, 'Não recebi sua resposta. O teste foi concluído.');

    try {
        const call = await client.calls.create({
            twiml: twiml.toString(),
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
        });

        return NextResponse.json({ success: true, sid: call.sid });
    } catch (error: any) {
        console.error("Twilio Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
