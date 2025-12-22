# AI-Powered RFP Management System

A modern web application that streamlines the Request for Proposal (RFP) workflow using AI. Create structured RFPs from natural language, manage vendors, send/receive emails, and compare proposals with AI-powered recommendations.

![Tech Stack](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=flat&logo=google&logoColor=white)

## Features

- **Natural Language RFP Creation**: Describe procurement needs in plain English; AI converts to structured data
- **Intelligent Vendor Matching**: Auto-match vendors based on product keywords
- **Email Integration**: Send RFPs via SMTP and receive responses via IMAP
- **AI Response Parsing**: Automatically extract pricing, delivery, and terms from vendor emails
- **Smart Comparison**: AI-powered scoring and recommendations for vendor selection

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [Tech Stack](#tech-stack)
3. [API Documentation](#api-documentation)
4. [Design Decisions](#design-decisions)
5. [AI Tools Usage](#ai-tools-usage)

---

## Project Setup

### Prerequisites

- **Node.js**: v20.19+ or v22.12+
- **MongoDB**: Local instance or MongoDB Atlas
- **Gmail Account**: With 2FA enabled and App Password generated
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/procurement.git
cd procurement

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Configuration

Create `.env` file in `/backend`:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
MONGODB_URI=mongodb://localhost:27017/procurement_db
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password
```

#### Gmail App Password Setup

1. Enable 2-Step Verification on your Google account
2. Go to **Security → 2-Step Verification → App passwords**
3. Create a new app password for "Mail"
4. Use the 16-character code (without spaces) as `EMAIL_PASS`

### Running Locally

```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Start backend
cd backend
npm run dev

# Terminal 3: Start frontend
cd frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

### Seed Data (Optional)

```bash
cd backend
node seed.js
```

This creates sample vendors with product keywords for testing.

---

## Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| **Frontend** | React + TypeScript + Vite | Fast dev experience, type safety |
| **Styling** | TailwindCSS | Rapid UI development, utility-first |
| **Backend** | Node.js + Express | JavaScript ecosystem, async handling |
| **Database** | MongoDB + Mongoose | Flexible schema for RFP variations |
| **AI** | Google Gemini (gemini-2.0-flash) | Cost-effective, fast inference |
| **Email Send** | Nodemailer (SMTP) | Industry standard, Gmail support |
| **Email Receive** | imap-simple + mailparser | Real IMAP polling for inbox |

---

## API Documentation

### RFPs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/rfps` | Create RFP (AI parses natural language) |
| `GET` | `/api/rfps` | List all RFPs |
| `GET` | `/api/rfps/:id` | Get RFP details |
| `DELETE` | `/api/rfps/:id` | Delete RFP |
| `GET` | `/api/rfps/:id/matching-vendors` | Get matched vendors by keywords |
| `POST` | `/api/rfps/:id/generate-email` | Generate email template |
| `POST` | `/api/rfps/:id/send-email` | Send email to vendor |
| `POST` | `/api/rfps/:id/compare` | AI comparison of proposals |

#### Create RFP Example

```bash
POST /api/rfps
Content-Type: application/json

{
  "title": "Office Equipment RFP",
  "description": "I need 20 laptops with 16GB RAM for the dev team. Budget is $30,000."
}
```

**Response:**
```json
{
  "_id": "...",
  "title": "Office Equipment RFP",
  "description": "...",
  "structured_requirements": {
    "budget": "$30,000",
    "timeline": "Flexible",
    "items": [
      { "name": "Laptop", "quantity": 20, "specs": "16GB RAM" }
    ]
  }
}
```

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vendors` | List all vendors |
| `POST` | `/api/vendors` | Create vendor |
| `PUT` | `/api/vendors/:id` | Update vendor |
| `DELETE` | `/api/vendors/:id` | Delete vendor |

### Proposals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rfps/:id/proposals` | Get proposals for RFP |
| `POST` | `/api/proposals/simulate` | Simulate vendor response |
| `POST` | `/api/proposals/check-emails` | Check inbox for new proposals |

---

## Design Decisions

### 1. Data Modeling

**RFP Schema:**
- `title`, `description`: User input
- `structured_requirements`: AI-extracted JSON (budget, timeline, items array)
- `status`: open → closed → awarded

**Vendor Schema:**
- `products`: Array of keywords for intelligent matching
- Matching algorithm scores vendors based on keyword overlap with RFP items

**Proposal Schema:**
- `raw_content`: Original email text
- `structured_data`: AI-parsed fields (price, delivery, warranty)
- `score`, `rank`: Set after AI comparison

### 2. AI Integration Points

| Feature | AI Usage |
|---------|----------|
| RFP Creation | Parse natural language → structured JSON |
| Email Template | Generate professional RFP invitation |
| Response Parsing | Extract price/delivery/warranty from messy text |
| Comparison | Score vendors (0-100), rank, explain reasoning |

**Prompt Design Philosophy:**
- Use JSON output format for reliability
- Include context (RFP requirements) in parsing prompts
- Request structured fields explicitly to reduce hallucination

### 3. Email Workflow

**Sending:**
- Template with placeholders (`{{vendor_name}}`, `{{contact_person}}`)
- Client-side variable replacement for bulk send
- Single AI call for template generation (efficiency)

**Receiving:**
- IMAP polling (manual trigger via "Check Replies" button)
- Match emails by subject line containing RFP title
- Match sender email to registered vendors
- Auto-create proposal on match

### 4. Vendor Matching Algorithm

```javascript
// Score = sum of matched product keywords
for (item in rfp.items) {
  for (product in vendor.products) {
    if (item.name.toLowerCase().includes(product.toLowerCase())) {
      score += 10;
    }
  }
}
```

### Assumptions

1. **Single User**: No authentication required
2. **Email Format**: Vendors reply with subject containing RFP title
3. **Text-Only Parsing**: Attachments (PDFs) not parsed in this version
4. **Gmail**: Configured for Gmail SMTP/IMAP; other providers need config changes

---

## AI Tools Usage

### Tools Used

| Tool | Purpose |
|------|---------|
| **Claude (Anthropic)** | Planning, coding, debugging |
| **Google Gemini API** | Runtime AI for RFP parsing, email generation, comparison |

### How AI Helped

1. **Boilerplate Generation**: React components, Express routes, Mongoose models
2. **Prompt Engineering**: Iterating on system prompts for reliable JSON output
3. **Debugging**: Identifying IMAP connection issues, CORS errors
4. **UI/UX**: Tailwind class suggestions, responsive design patterns

### Key Learnings

- **Structured Output**: Forcing JSON output via prompt improves reliability
- **Temperature**: Using low temperature (0.7) for factual extraction tasks
- **Error Handling**: AI responses need validation; always wrap in try-catch
- **Token Efficiency**: Generate one template, replace variables client-side for bulk operations

---

## Project Structure

```
procurement/
├── backend/
│   ├── controllers/       # Route handlers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic (AI, Email, IMAP)
│   ├── server.js          # Express app
│   └── seed.js            # Sample data
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main app with routing
│   │   └── index.css      # Tailwind config
│   └── index.html
└── README.md
```

---

## Known Limitations

1. **No PDF Parsing**: Vendor attachments are not processed
2. **Manual Email Check**: No background polling; user must click "Check Replies"
3. **Subject Matching**: Relies on RFP title being in reply subject
4. **Single Email Account**: Sends and receives from the same configured account

---

## Demo Video

[Link to 5-10 minute walkthrough video demonstrating all features]

---

## License

MIT
