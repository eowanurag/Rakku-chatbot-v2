export interface ComplaintTypeAlias {
  aliases: string[];
  complaintType: string;
}

export const COMPLAINT_TYPE_ALIASES: ComplaintTypeAlias[] = [
  {
    aliases: [
      "lost purse",
      "lost my purse",
      "lost wallet",
      "lost my wallet",
      "lost bag",
      "lost my bag",
      "purse missing",
      "wallet missing",
      "bag missing",
      "my bag is lost",
      "passport missing",
      "lost passport",
      "lost my passport",
      "passport lost",
      "aadhaar lost",
      "lost my aadhaar",
      "pan lost",
      "lost my pan",
      "documents missing",
      "documents lost",
      "lost my documents",
      "certificate lost",
      "id card lost",
      "license lost",
      "wallet lost",
      "purse lost"
    ],
    complaintType: "Lost Document"
  },
  {
    aliases: [
      "phone stolen",
      "mobile stolen",
      "phone gone",
      "mobile theft",
      "stolen phone",
      "lost mobile",
      "lost my mobile",
      "lost phone",
      "lost my phone",
      "iphone stolen",
      "android stolen",
      "sim lost",
      "lost my sim",
      "sim stolen",
      "device stolen",
      "device lost",
      "lost my device"
    ],
    complaintType: "Lost Mobile / Theft"
  },
  {
    aliases: [
      "money fraud",
      "online scam",
      "cheated online",
      "money deducted",
      "fraud",
      "upi fraud",
      "bank scam",
      "scam",
      "otp scam",
      "transaction scam",
      "online fraud",
      "bank fraud",
      "money lost"
    ],
    complaintType: "Cyber Fraud / Financial Loss"
  },
  {
    aliases: [
      "harassed",
      "threatened",
      "harassment",
      "abuse",
      "threat",
      "stalking",
      "bullying",
      "abused"
    ],
    complaintType: "Simple Harassment"
  }
];
