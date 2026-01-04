import { TICKET_TYPES, TICKET_TYPE_NAMES } from '../config/constants.js';

/**
 * AI Auto-Response service
 * Provides context-aware first responses based on ticket type
 * Maintained via Context7 for consistency
 */

const RESPONSE_TEMPLATES = {
  [TICKET_TYPES.DEVELOPER]: {
    title: '🧑‍💻 Developer Work Request',
    message: `Thank you for opening a developer work request ticket!

Our development team has been notified and will review your request shortly.

**To help us assist you better, please provide:**
• A detailed description of the work needed
• Any specific requirements or constraints
• Expected timeline or deadline
• Relevant files or examples (if applicable)

We'll get back to you as soon as possible!`
  },
  [TICKET_TYPES.GENERAL]: {
    title: '📩 General Request',
    message: `Thank you for contacting support!

Our team has been notified and will assist you shortly.

**Please provide:**
• A clear description of your request or issue
• Any relevant information that might help us assist you
• Screenshots or error messages (if applicable)

We appreciate your patience!`
  },
  [TICKET_TYPES.STAFF_APPLICATION]: {
    title: '🛡️ Staff Application',
    message: `Thank you for your interest in joining our staff team!

Your application has been received and will be reviewed by our administration team.

**Please make sure to include:**
• Your previous experience (if any)
• Why you want to become staff
• Your availability
• Any additional relevant information

We'll review your application and get back to you soon. Good luck!`
  },
  [TICKET_TYPES.OTHER]: {
    title: '❓ Other',
    message: `Thank you for opening a ticket!

Our support team has been notified and will assist you shortly.

**Please provide:**
• A detailed description of your inquiry
• Any relevant context or information
• What you're hoping to achieve

We'll do our best to help you!`
  }
};

export function getAutoResponse(ticketType) {
  return RESPONSE_TEMPLATES[ticketType] || RESPONSE_TEMPLATES[TICKET_TYPES.OTHER];
}
