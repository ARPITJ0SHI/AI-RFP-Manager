const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const Proposal = require('../models/Proposal');
const RFP = require('../models/RFP');
const Vendor = require('../models/Vendor');
const aiService = require('./aiService');
require('dotenv').config();

const getImapConfig = () => {
    return {
        imap: {
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASS,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 3000
        }
    };
};

exports.checkInboxForProposals = async () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("[IMAP Service] Missing email credentials. Skipping inbox check.");
        return { success: false, error: 'Missing credentials' };
    }

    let connection = null;
    const processedProposals = [];

    try {
        console.log("[IMAP Service] Connecting to IMAP...");
        connection = await imaps.connect(getImapConfig());
        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`[IMAP Service] Found ${messages.length} unread messages.`);

        for (const message of messages) {
            const all = message.parts.find(part => part.which === '');
            const id = message.attributes.uid;
            const idHeader = 'Imap-Id: ' + id + '\r\n';

            const parsed = await simpleParser(idHeader + all.body);
            const subject = parsed.subject;
            const from = parsed.from.text;
            const fromAddress = parsed.from.value[0].address;
            const textBody = parsed.text;

            console.log(`[IMAP Service] Processing email from ${fromAddress}: "${subject}"`);

            const rfps = await RFP.find({ status: 'open' });
            let matchedRfp = null;
            const subjectLower = subject.toLowerCase();

            for (const rfp of rfps) {
                if (subjectLower.includes(rfp.title.toLowerCase())) {
                    matchedRfp = rfp;
                    console.log(`[IMAP Service] Matched RFP: "${rfp.title}"`);
                    break;
                }
            }

            if (!matchedRfp) {
                console.log("[IMAP Service] No matching open RFP found for subject:", subject);
                continue;
            }

            const vendor = await Vendor.findOne({ email: fromAddress });
            if (!vendor) {
                console.log("[IMAP Service] No registered vendor found for email:", fromAddress);
                continue;
            }

            const existingProposal = await Proposal.findOne({ rfp: matchedRfp._id, vendor: vendor._id });
            if (existingProposal) {
                console.log("[IMAP Service] Proposal already exists for this vendor/RFP.");
                continue;
            }

            console.log("[IMAP Service] Parsing proposal with AI...");
            const structuredData = await aiService.parseProposal(textBody, matchedRfp.structured_requirements);

            const newProposal = new Proposal({
                rfp: matchedRfp._id,
                vendor: vendor._id,
                raw_content: textBody,
                structured_data: structuredData,
                source: 'email',
                receivedAt: new Date()
            });

            await newProposal.save();
            processedProposals.push(newProposal);
            console.log(`[IMAP Service] Created proposal for ${vendor.name}`);
        }

        return { success: true, count: processedProposals.length, proposals: processedProposals };

    } catch (error) {
        console.error("[IMAP Service] Error checking inbox:", error);
        return { success: false, error: error.message };
    } finally {
        if (connection) {
            try {
                connection.end();
            } catch (err) {
                console.error("Error closing IMAP connection:", err);
            }
        }
    }
};
