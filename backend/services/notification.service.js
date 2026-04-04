import twilio from "twilio";
export const notifyRangerAssignment = async (patrol, rangers) => {
    if (process.env.NODE_ENV === "test") {
        return;
    }

    const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER?.trim(); // e.g. 'whatsapp:+14155238886'

    let twilioClient = null;
    if (twilioSid && twilioToken) {
        console.log("Twilio WhatsApp Service Authenticated Dynamically");
        twilioClient = twilio(twilioSid, twilioToken);
    } else {
        console.warn("TWILIO ENV CREDENTIALS MISSING! Cannot dispatch WhatsApp messages.");
    }

    for (const ranger of rangers) {
        if (!ranger.phone) {
            console.warn(`\[TWILIO DISPATCH ERROR] Ranger ${ranger.name || ranger.email} has NO phone number assigned in database! Skipping WhatsApp notification.`);
            continue;
        }

        const lat = patrol.exactLocation?.lat;
        const lng = patrol.exactLocation?.lng;
        const locationText = (lat && lng)
            ? `${lat.toFixed(4)}, ${lng.toFixed(4)}\\n\*Map:\* https://www.google.com/maps?q=${lat},${lng}`
            : "Not provided";

        const messageBody = `🌿 \*New Patrol Assigned\*\\n\\n` +
            `\*Patrol:\* ${patrol.title || "Wildlife Mission"}\\n` +
            `\*Location:\* ${locationText}\\n` +
            `\*Start Time:\* ${new Date(patrol.plannedStart).toLocaleString()}\\n\\n` +
            `Please check your dashboard for details and report check-ins.`;

        // 1. Send via Twilio (Direct WhatsApp)
        if (twilioClient && twilioFrom) {
            try {
                const result = await twilioClient.messages.create({
                    from: twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`,
                    to: ranger.phone.startsWith('whatsapp:') ? ranger.phone : `whatsapp:${ranger.phone}`,
                    body: messageBody
                });
                console.log(`Twilio WhatsApp successfully queued to ${ranger.phone}: ${result.sid}`);
            } catch (err) {
                console.error(`Twilio WhatsApp API Failed for ${ranger.phone}:`, err.message);
            }
        } else {
            console.log(`Twilio not configured. Skipping direct WhatsApp for ${ranger.phone}`);
        }
    }
};
