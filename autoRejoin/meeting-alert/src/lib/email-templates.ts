/**
 * Email Templates for Meeting Alert
 *
 * Professional HTML email templates with inline CSS for maximum compatibility.
 *
 * WHY INLINE CSS:
 * - Email clients (Gmail, Outlook, Apple Mail) have limited CSS support
 * - External stylesheets are stripped by most email clients
 * - Inline styles ensure consistent rendering across all clients
 * - Use tables for layout (flexbox/grid not widely supported)
 *
 * EMAIL CLIENT COMPATIBILITY:
 * - Tested for: Gmail, Outlook, Apple Mail, Yahoo Mail
 * - Mobile responsive (max-width 600px)
 * - Safe colors and fonts (web-safe font stack)
 * - Avoid: advanced CSS, JavaScript, external images (use data URIs if needed)
 *
 * DESIGN INSPIRATION:
 * - Stripe: Clean, professional, action-focused
 * - Vercel: Modern, minimal, clear CTAs
 * - Resend: Simple, beautiful, developer-friendly
 */

/**
 * Parameters for participant joined email
 */
export interface ParticipantJoinedEmailParams {
  userName: string // Recipient's name (e.g., "John")
  userEmail: string // Recipient's email
  participantName: string // Who joined (e.g., "Sarah Smith")
  meetingTitle: string // Meeting name
  meetingLink: string // Google Meet URL
  joinedAt: string // ISO timestamp when participant joined
}

/**
 * Email template result
 */
export interface EmailTemplate {
  subject: string
  html: string
}

/**
 * Format timestamp to readable format
 *
 * Example: "2:45 PM on Tuesday, Feb 4"
 */
function formatJoinedTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const day = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
  return `${time} on ${day}`
}

/**
 * Participant Joined Email Template
 *
 * Sends when a new participant joins a meeting the user is monitoring.
 *
 * DESIGN FEATURES:
 * - Clear, action-oriented subject line
 * - Professional blue header with white text
 * - Large, centered CTA button
 * - Participant info and join time
 * - Footer with notification settings link
 * - Mobile responsive (600px max width)
 * - Inline CSS for email client compatibility
 *
 * @param params - Email template parameters
 * @returns Email subject and HTML body
 *
 * @example
 * const email = participantJoinedEmail({
 *   userName: 'John',
 *   userEmail: 'john@example.com',
 *   participantName: 'Sarah Smith',
 *   meetingTitle: 'Team Standup',
 *   meetingLink: 'https://meet.google.com/abc-defg-hij',
 *   joinedAt: new Date().toISOString()
 * })
 */
export function participantJoinedEmail(
  params: ParticipantJoinedEmailParams
): EmailTemplate {
  const {
    userName,
    participantName,
    meetingTitle,
    meetingLink,
    joinedAt,
  } = params

  const joinTime = formatJoinedTime(joinedAt)
  const subject = `🔔 ${participantName} just joined your meeting`

  /**
   * HTML Email Body
   *
   * STRUCTURE:
   * 1. Wrapper table (centered, 600px max width)
   * 2. Header (blue background, logo/title)
   * 3. Content area (white, padded)
   * 4. CTA button (blue, large, centered)
   * 5. Details section (gray text)
   * 6. Footer (gray background, links)
   *
   * INLINE CSS RULES:
   * - All styles inline (email client compatibility)
   * - Tables for layout (email clients don't support flexbox/grid)
   * - Max width 600px (mobile-friendly)
   * - Web-safe fonts: Arial, Helvetica, sans-serif
   * - Colors: #2563eb (blue), #1e40af (dark blue), #f3f4f6 (gray)
   */
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Participant Joined Meeting</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
  <!-- Wrapper Table (centers email, max 600px) -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <!-- Main Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">

          <!-- Header (Blue Background) -->
          <tr>
            <td style="background-color: #2563eb; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; line-height: 1.4;">
                Meeting Alert
              </h1>
              <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 14px;">
                Never miss a meeting participant
              </p>
            </td>
          </tr>

          <!-- Content Area -->
          <tr>
            <td style="padding: 40px;">

              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
              </p>

              <!-- Main Message -->
              <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                <strong style="color: #2563eb;">${participantName}</strong> just joined your meeting:
              </p>

              <!-- Meeting Title (Highlighted) -->
              <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px 20px; margin: 0 0 32px 0; border-radius: 4px;">
                <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">
                  ${meetingTitle}
                </p>
              </div>

              <!-- CTA Button (Rejoin Meeting) -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 0 0 32px 0;">
                    <a href="${meetingLink}"
                       style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 16px; font-weight: 600; border-radius: 6px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                      Rejoin Meeting Now
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Details Section -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong style="color: #374151;">Participant:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                      ${participantName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong style="color: #374151;">Joined at:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                      ${joinTime}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong style="color: #374151;">Meeting:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                      ${meetingTitle}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Info Note -->
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
                💡 <strong>Tip:</strong> Click the button above to instantly rejoin your meeting. This notification was sent because you have Meeting Alert enabled for this meeting.
              </p>

            </td>
          </tr>

          <!-- Footer (Gray Background) -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                You're receiving this because you enabled notifications for this meeting.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="color: #2563eb; text-decoration: none; font-weight: 500;">
                  Manage notification settings
                </a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy"
                   style="color: #2563eb; text-decoration: none; font-weight: 500;">
                  Privacy Policy
                </a>
              </p>
              <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Meeting Alert. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  return { subject, html }
}

/**
 * Test email template (for development/testing)
 *
 * Use this to preview email design before sending
 */
export function getTestEmail(): EmailTemplate {
  return participantJoinedEmail({
    userName: 'John',
    userEmail: 'john@example.com',
    participantName: 'Sarah Smith',
    meetingTitle: 'Team Standup - Q1 Planning',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    joinedAt: new Date().toISOString(),
  })
}
