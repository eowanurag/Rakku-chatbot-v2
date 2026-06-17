import { IncidentModel, PropertyEntity } from '../interfaces/complaint-intelligence.interface';

export class DraftGenerator {
  public generate(
    model: IncidentModel,
    language: "en" | "hi" | "hinglish"
  ): string {
    const brand = model.property[0]?.brand || "Unknown Brand";
    const devModel = model.property[0]?.model || "Unknown Model";
    const loc = model.incidentLocation || "Unknown Location";
    const date = model.incidentDate || "Unknown Date";

    const templates = {
      en: `Subject: Complaint Regarding Loss of Mobile Phone

Respected Officer,

I wish to report that my mobile phone was lost near ${loc} on approximately ${date}.
The details of the property are as follows:
- Brand: ${brand}
- Model: ${devModel}
- Incident Location: ${loc}

I request you to register a report (lost report) and issue an acknowledgment so that I can apply for a duplicate SIM card and request device blacklisting.

Sincerely,
[Applicant Name]`,

      hi: `विषय: मोबाइल फोन खोने के संबंध में शिकायत

आदरणीय पुलिस अधिकारी महोदय,

मैं विनम्रतापूर्वक रिपोर्ट करना चाहता हूँ कि मेरा मोबाइल फोन लगभग ${date} को ${loc} के पास खो गया था।
विवरण नीचे दिया गया है:
- कंपनी: ${brand}
- मॉडल: ${devModel}
- घटना का स्थान: ${loc}

मैं आपसे अनुरोध करता हूँ कि कृपया इस संबंध में रिपोर्ट दर्ज करें ताकि मैं डुप्लीकेट सिम कार्ड प्राप्त कर सकूँ।

भवदीय,
[आवेदक का नाम]`,

      hinglish: `Subject: Complaint Regarding Mobile Phone Loss

Respected Sir/Madam,

Mera mobile phone ${loc} ke paas approximately ${date} ko kho gaya hai.
Device details:
- Brand: ${brand}
- Model: ${devModel}
- Location: ${loc}

Please is complaint ko register karein aur acknowledgement certificate generate karein taaki main new SIM card nikalwa sakun.

Thanks,
[Applicant Name]`
    };

    return templates[language] || templates['en'];
  }
}
