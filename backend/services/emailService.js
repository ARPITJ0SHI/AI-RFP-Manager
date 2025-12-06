const nodemailer = require('nodemailer');
const aiService = require('./aiService');
require('dotenv').config();

let transporter = null;

const initTransporter = () => {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'test@example.com') {
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    return transporter;
};

exports.sendRFP = async (vendor, rfp) => {
    console.log(`[Email Service] Preparing RFP "${rfp.title}" for ${vendor.email}...`);

    const emailBody = await aiService.generateEmailContent(rfp, vendor);

    if (!transporter) {
        initTransporter();
    }

    if (!transporter) {
        console.log("[Email Service] No email credentials. Simulating send.");
        console.log(`[Email Service] Would send to: ${vendor.email}`);
        console.log(`[Email Service] Subject: RFP: ${rfp.title}`);
        return { success: true, simulated: true, emailBody };
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: vendor.email,
        subject: `RFP: ${rfp.title}`,
        text: emailBody,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a5f;">Request for Proposal</h2>
            <h3>${rfp.title}</h3>
            <div style="white-space: pre-wrap;">${emailBody}</div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">
                This is an automated RFP invitation. Please reply with your proposal.
            </p>
        </div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Email sent to ${vendor.email}`);
        return { success: true, simulated: false };
    } catch (error) {
        console.error(`[Email Service] Failed to send email to ${vendor.email}:`, error.message);
        return { success: false, error: error.message };
    }
};

exports.sendBulkRFP = async (vendors, rfp) => {
    const results = [];
    for (const vendor of vendors) {
        const result = await exports.sendRFP(vendor, rfp);
        results.push({ vendor: vendor.name, email: vendor.email, ...result });
    }
    return results;
};

exports.generateMockVendorResponse = (vendor, rfp) => {
    const requirements = rfp.structured_requirements || {};
    const items = requirements.items || [];

    const basePrice = Math.floor(Math.random() * 10000) + 5000;
    const deliveryDays = Math.floor(Math.random() * 20) + 5;
    const warrantyYears = Math.floor(Math.random() * 3) + 1;

    const itemPricing = items.map(item => ({
        item: item.name,
        quantity: item.quantity || 1,
        unit_price: Math.floor(Math.random() * 500) + 100,
        total: (item.quantity || 1) * (Math.floor(Math.random() * 500) + 100)
    }));

    const totalPrice = itemPricing.reduce((sum, item) => sum + item.total, 0) || basePrice;

    return `Dear Procurement Team,

Thank you for the opportunity to submit our proposal for "${rfp.title}".

We are pleased to offer the following:

PRICING SUMMARY:
${itemPricing.map(p => `- ${p.item}: $${p.unit_price} x ${p.quantity} = $${p.total}`).join('\n') || `Total Package: $${totalPrice}`}

Total Price: $${totalPrice} USD

DELIVERY:
We can deliver within ${deliveryDays} business days from order confirmation.

WARRANTY:
We offer a ${warrantyYears}-year comprehensive warranty covering parts and labor.

PAYMENT TERMS:
We accept Net 30 payment terms as requested.

ADDITIONAL NOTES:
- Free shipping included
- Installation support available
- 24/7 technical support included

We look forward to partnering with you on this project.

Best regards,
${vendor.contact_person || vendor.name}
${vendor.name}
${vendor.email}
${vendor.phone || ''}`;
};

exports.checkInbox = async () => {
    console.log("[Email Service] Checking inbox (simulation mode)...");
    return [];
};

exports.sendCustomEmail = async (vendor, subject, body) => {
    console.log(`[Email Service] Sending custom email to ${vendor.email}...`);

    if (!transporter) {
        initTransporter();
    }

    if (!transporter) {
        console.log("[Email Service] No email credentials. Simulating send.");
        console.log(`[Email Service] Would send to: ${vendor.email}`);
        console.log(`[Email Service] Subject: ${subject}`);
        return { success: true, simulated: true, subject, body };
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: vendor.email,
        subject: subject,
        text: body,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="white-space: pre-wrap;">${body.replace(/\n/g, '<br>')}</div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">
                This is an automated RFP invitation. Please reply with your proposal.
            </p>
        </div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Email sent to ${vendor.email}`);
        return { success: true, simulated: false };
    } catch (error) {
        console.error(`[Email Service] Failed to send email to ${vendor.email}:`, error.message);
        return { success: false, error: error.message };
    }
};
