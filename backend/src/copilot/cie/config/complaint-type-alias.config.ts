export interface ComplaintTypeAlias {
  aliases: string[];
  complaintType: string;
}

export const COMPLAINT_TYPE_ALIASES: ComplaintTypeAlias[] = [
  {
    aliases: [
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
      "license lost"
    ],
    complaintType: "Lost Document"
  },
  {
    aliases: [
      'lost purse',
      'purse lost',
      'lost wallet',
      'wallet lost',
      'wallet missing',
      'purse missing',
      'lost my purse',
      'lost my wallet',
      'my bag is missing',
      'lost my bag',
      'lost handbag',
      'handbag lost',
      'lost backpack',
      'backpack missing',
      'my purse is missing',
      'misplaced wallet',
      'misplaced purse',
      'misplaced bag',
      'lost laptop bag',
      'laptop bag lost',
      'laptop bag missing',
      'lost briefcase',
      'briefcase lost',
      'briefcase missing',
      'lost sling bag',
      'sling bag lost',
      'sling bag missing'
    ],
    complaintType: 'AMBIGUOUS_LOST_ITEM'
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
