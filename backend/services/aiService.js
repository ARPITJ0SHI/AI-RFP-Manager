const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

exports.parseRFP = async (text) => {
  const prompt = `
You are a procurement expert. Convert the following natural language procurement request into a structured JSON object.

Request: "${text}"

Instructions:
- Extract quantity and item names from the request
- For specs, infer reasonable professional-grade specifications based on the item type
- If budget is not explicitly mentioned, estimate a reasonable range
- If timeline is not mentioned, set it to "Timeline to be confirmed with vendor"
- For payment_terms, use "Net 30" as default if not specified
- For warranty, suggest standard warranty based on item type

Output JSON format:
{
    "title": "Short descriptive title",
    "items": [
        { "name": "Item name", "quantity": Number, "specs": "Detailed professional specifications", "unit_price_estimate": Number }
    ],
    "budget": "Budget string or specific amount",
    "timeline": "Delivery timeline",
    "payment_terms": "Payment terms",
    "warranty": "Warranty requirements",
    "special_requirements": "Any additional requirements mentioned"
}

RETURN ONLY JSON. Do not include markdown formatting or explanations.
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Parsing Error:", error);
    return {
      title: "Draft RFP",
      items: [],
      budget: "Pending",
      timeline: "Pending",
      payment_terms: "Net 30",
      warranty: "Standard warranty",
      special_requirements: ""
    };
  }
};

exports.parseProposal = async (emailBody, rfpRequirements) => {
  const prompt = `
Extract key proposal details from this vendor email response into JSON.

Email: "${emailBody}"

RFP Requirements for context: ${JSON.stringify(rfpRequirements || {})}

Output JSON format:
{
    "total_price": Number,
    "currency": "USD",
    "unit_prices": [{ "item": "Item name", "price": Number, "quantity": Number }],
    "delivery_time": "String describing delivery timeline",
    "warranty_offered": "Warranty details",
    "payment_terms_accepted": true or false,
    "additional_terms": "Any additional terms or conditions",
    "deviations": "Any deviations from requirements",
    "vendor_notes": "Any special notes from vendor"
}

RETURN JSON ONLY. Do not include markdown formatting.
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Proposal Parsing Error:", error);
    return {
      total_price: 0,
      currency: "USD",
      unit_prices: [],
      delivery_time: "Unknown",
      warranty_offered: "Unknown",
      payment_terms_accepted: false,
      additional_terms: "",
      deviations: "Error parsing proposal",
      vendor_notes: ""
    };
  }
};

exports.compareProposals = async (rfp, proposals) => {
  if (!proposals || proposals.length === 0) {
    return [];
  }

  const prompt = `
You are a procurement analyst. Compare these vendor proposals for the RFP and provide detailed analysis.

RFP Title: "${rfp.title}"
RFP Requirements: ${JSON.stringify(rfp.structured_requirements)}

Vendor Proposals:
${JSON.stringify(proposals.map(p => ({
    vendor: p.vendor?.name || 'Unknown Vendor',
    email: p.vendor?.email || '',
    proposal: p.structured_data
  })), null, 2)}

Analyze each proposal based on:
1. Price competitiveness
2. Delivery timeline
3. Warranty coverage
4. Compliance with requirements
5. Overall value

Rank them from best to worst. Provide a score (0-100) and brief reasoning for each.

Output JSON array:
[
    {
        "vendor": "Vendor Name",
        "score": 95,
        "rank": 1,
        "price_analysis": "Brief price analysis",
        "delivery_analysis": "Brief delivery analysis",
        "compliance": "How well they meet requirements",
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1"],
        "recommendation": "Why this vendor is recommended or not",
        "reason": "Overall summary of evaluation"
    }
]

RETURN JSON ONLY. Do not include markdown formatting.
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Comparison Error:", error);
    return proposals.map((p, idx) => ({
      vendor: p.vendor?.name || 'Unknown',
      score: 50,
      rank: idx + 1,
      reason: "Unable to perform AI analysis"
    }));
  }
};

exports.generateEmailContent = async (rfp, vendor) => {
  const prompt = `
Generate a professional RFP invitation email for a vendor in html.

RFP Details:
- Title: ${rfp.title}
- Description: ${rfp.description}
- Requirements: ${JSON.stringify(rfp.structured_requirements)}

Vendor: ${vendor.name}

Write a professional, concise email that:
1. Introduces the RFP
2. Lists key requirements
3. Asks for their proposal with pricing
4. Mentions the deadline/timeline
5. Provides response instructions

Output as plain text email body only. No JSON.
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    return `Dear ${vendor.name},

We are inviting you to submit a proposal for: ${rfp.title}

${rfp.description}

Please reply with your detailed quote including pricing, delivery timeline, and warranty terms.

Best regards,
Procurement Team`;
  }
};

exports.generateEmailTemplate = async (rfp) => {
  const companyName = "TechProcure Solutions";
  const senderName = "Arpit";
  const senderTitle = "Procurement Manager";
  const companyPhone = "+1 (555) 123-4567";
  const companyEmail = "procurement@techprocure.com";

  const prompt = `
Generate a professional RFP invitation email TEMPLATE in html for vendors. Return as JSON with subject and body.
Use the following placeholders exactly where specific vendor details are needed:
- {{vendor_name}} : For the vendor company name
- {{contact_person}} : For the contact person's name

SENDER COMPANY INFO:
- Company: ${companyName}
- Sender: ${senderName}, ${senderTitle}
- Email: ${companyEmail}
- Phone: ${companyPhone}

RFP Details:
- Title: ${rfp.title}
- Description: ${rfp.description}
- Budget: ${rfp.structured_requirements?.budget || 'To be discussed'}
- Timeline: ${rfp.structured_requirements?.timeline || 'Flexible'}
- Items: ${JSON.stringify(rfp.structured_requirements?.items || [])}

Generate a professional, concise email template with:
1. Clear subject line
2. Professional greeting using {{contact_person}}
3. Brief introduction
4. RFP summary
5. Request for quotation
6. Closing with sender details

Output JSON format:
{
  "subject": "RFP: [subject]...",
  "body": "Email body with placeholders and \\n for line breaks"
}

RETURN JSON ONLY.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();
    const jsonStr = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Email Template Error:", error);
    return {
      subject: `RFP Invitation: ${rfp.title} - ${companyName}`,
      body: `Dear {{contact_person}},

I hope this email finds you well.

My name is ${senderName}, ${senderTitle} at ${companyName}. We are reaching out to {{vendor_name}} regarding a procurement opportunity.

RE: ${rfp.title}

${rfp.description}

We are seeking quotations for the following:
${(rfp.structured_requirements?.items || []).map(item => `• ${item.quantity}x ${item.name}`).join('\n') || '• As per attached requirements'}

Key Details:
• Budget: ${rfp.structured_requirements?.budget || 'To be discussed'}
• Timeline: ${rfp.structured_requirements?.timeline || 'Flexible'}

Please provide your best quotation.

Best regards,

${senderName}
${senderTitle}
${companyName}`
    };
  }
};

exports.generateEmailDraft = async (rfp, vendor) => {
  const companyName = "TechProcure Solutions";
  const senderName = "Arpit";
  const senderTitle = "Procurement Manager";
  const companyPhone = "+1 (555) 123-4567";
  const companyEmail = "procurement@techprocure.com";

  const prompt = `
Generate a professional RFP invitation email for a vendor. Return as JSON with subject and body.

SENDER COMPANY INFO:
- Company: ${companyName}
- Sender: ${senderName}, ${senderTitle}
- Email: ${companyEmail}
- Phone: ${companyPhone}

VENDOR INFO:
- Vendor Company: ${vendor.name}
- Contact Person: ${vendor.contact_person || 'Procurement Team'}
- Email: ${vendor.email}

RFP Details:
- Title: ${rfp.title}
- Description: ${rfp.description}
- Budget: ${rfp.structured_requirements?.budget || 'To be discussed'}
- Timeline: ${rfp.structured_requirements?.timeline || 'Flexible'}
- Items: ${JSON.stringify(rfp.structured_requirements?.items || [])}

Generate a professional, concise email with:
1. Clear subject line including RFP reference
2. Professional greeting addressing the vendor contact
3. Brief introduction of our company
4. RFP summary with requirements
5. Request for formal quotation
6. Deadline/timeline mention
7. Professional closing with sender details

The email should be formal but friendly.

Output JSON format:
{
  "subject": "RFP: [descriptive subject]",
  "body": "Email body with line breaks"
}

RETURN JSON ONLY.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();
    const jsonStr = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Email Draft Error:", error);
    return {
      subject: `RFP Invitation: ${rfp.title} - ${companyName}`,
      body: `Dear ${vendor.contact_person || 'Procurement Team'},

I hope this email finds you well.

My name is ${senderName}, ${senderTitle} at ${companyName}. We are reaching out to ${vendor.name} regarding a procurement opportunity.

RE: ${rfp.title}

${rfp.description}

We are seeking quotations for the following:
${(rfp.structured_requirements?.items || []).map(item => `• ${item.quantity}x ${item.name}`).join('\n') || '• As per attached requirements'}

Key Details:
• Budget: ${rfp.structured_requirements?.budget || 'To be discussed'}
• Timeline: ${rfp.structured_requirements?.timeline || 'Flexible'}
• Payment Terms: ${rfp.structured_requirements?.payment_terms || 'Net 30'}

Please provide your best quotation including pricing, delivery timeline, and warranty terms.

We look forward to your response.

Best regards,

${senderName}
${senderTitle}
${companyName}
Email: ${companyEmail}
Phone: ${companyPhone}`
    };
  }
};

