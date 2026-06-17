/**
 * -------------------------------------------------------------
 * Contact Controller (Logic for processing contact submissions)
 * -------------------------------------------------------------
 */

const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');

/**
 * @desc    Submit contact form
 * @route   POST /api/contact
 * @access  Public
 */
const submitContact = async (req, res, next) => {
    // 1. Validate incoming request parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        return next(new Error(errors.array().map(err => err.msg).join(', ')));
    }

    const { name, email, subject, message } = req.body;

    try {
        // 2. Save submission to MongoDB Atlas
        const contact = await Contact.create({
            name,
            email,
            subject,
            message
        });

        console.log(`[Database] Submission successfully saved for: ${email}`);

        // 3. Configure Brevo REST API Settings
        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.SENDER_EMAIL;

        const isConfigured =
            apiKey && apiKey !== 'your_brevo_api_key' &&
            senderEmail && senderEmail !== 'your_verified_brevo_sender';

        let emailSent = false;
        let emailErrorMsg = '';

        if (isConfigured) {
            // Draft notification email (To You, the website owner)
            const notificationPayload = {
                sender: {
                    name: `${name} via Portfolio`,
                    email: senderEmail
                },
                to: [
                    {
                        email: senderEmail
                    }
                ],
                replyTo: {
                    email: email,
                    name: name
                },
                subject: `💼 New Portfolio Message: ${subject}`,
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 20px; text-align: center; color: white;">
                            <h2 style="margin: 0; font-size: 24px;">New Message Received</h2>
                        </div>
                        <div style="padding: 24px; background-color: #ffffff;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 120px; vertical-align: top;">Name:</td>
                                    <td style="padding: 8px 0; color: #0f172a;">${name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; color: #475569; vertical-align: top;">Email:</td>
                                    <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; color: #475569; vertical-align: top;">Subject:</td>
                                    <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${subject}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; color: #475569; vertical-align: top;">Date:</td>
                                    <td style="padding: 8px 0; color: #64748b;">${new Date(contact.createdAt).toLocaleString()}</td>
                                </tr>
                            </table>
                            <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                                <h4 style="margin: 0 0 10px 0; color: #475569;">Message:</h4>
                                <p style="margin: 0; color: #334155; white-space: pre-wrap; background-color: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #2563eb;">${message}</p>
                            </div>
                        </div>
                        <div style="background-color: #f1f5f9; text-align: center; padding: 12px; font-size: 12px; color: #64748b;">
                            Sent automatically from your portfolio website system.
                        </div>
                    </div>
                `
            };

            // Draft confirmation auto-reply email (To the visitor)
            const confirmationPayload = {
                sender: {
                    name: "Iniyavan",
                    email: senderEmail
                },
                to: [
                    {
                        email: email,
                        name: name
                    }
                ],
                subject: `👋 Thank you for reaching out, ${name}!`,
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center; color: white;">
                            <h2 style="margin: 0; font-size: 24px;">Thank You!</h2>
                        </div>
                        <div style="padding: 24px; background-color: #ffffff;">
                            <p style="font-size: 16px; color: #0f172a; margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
                            <p style="color: #334155; margin: 0 0 16px 0;">Thank you for getting in touch. I have received your message regarding "<strong>${subject}</strong>" and will review it as soon as possible.</p>
                            <p style="color: #334155; margin: 0 0 24px 0;">I typically respond to inquiries within 24–48 business hours. Talk to you soon!</p>
                            
                            <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; border: 1px dashed #cbd5e1; margin-bottom: 24px;">
                                <h4 style="margin: 0 0 8px 0; color: #475569;">Copy of your message:</h4>
                                <p style="margin: 0; color: #64748b; font-style: italic; white-space: pre-wrap;">"${message}"</p>
                            </div>
                            
                            <p style="margin: 0; font-weight: bold; color: #0f172a;">Best regards,</p>
                            <p style="margin: 4px 0 0 0; color: #475569;">Iniyavan<br>Full Stack Developer</p>
                        </div>
                        <div style="background-color: #f1f5f9; text-align: center; padding: 12px; font-size: 12px; color: #64748b;">
                            &copy; ${new Date().getFullYear()} Iniyavan. All rights reserved.
                        </div>
                    </div>
                `
            };

            const sendBrevoEmail = async (payload) => {
                const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'api-key': apiKey,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorDetails;
                    try {
                        errorDetails = JSON.parse(errorText);
                    } catch {
                        errorDetails = errorText;
                    }
                    const err = new Error(`Brevo API status ${response.status}`);
                    err.details = errorDetails;
                    throw err;
                }
                return await response.json();
            };

            try {
                // Send both emails in parallel
                await Promise.all([
                    sendBrevoEmail(notificationPayload),
                    sendBrevoEmail(confirmationPayload)
                ]);

                console.log(`[Brevo API] Successfully sent notification and confirmation emails.`);
                emailSent = true;
            } catch (brevoError) {
                console.error(`[Brevo API Error] Failed to send email via REST API:`);
                console.error(brevoError);

                // Log the exact Brevo error details
                const loggedError = brevoError.details ? JSON.stringify(brevoError.details) : brevoError.message;
                console.error(`Exact Brevo Error details: ${loggedError}`);
                emailErrorMsg = loggedError;
            }
        } else {
            console.log('[Brevo API Warning] Brevo API credentials are not fully configured. Skipping email dispatch.');
            emailErrorMsg = 'Brevo API credentials not configured.';
        }

        // 4. Return API response to frontend client
        res.status(201).json({
            success: true,
            message: emailSent
                ? 'Your message has been sent successfully! A confirmation email has been sent to your inbox.'
                : 'Your message was saved successfully! However, email notifications could not be sent.',
            emailSent,
            emailError: emailSent ? undefined : emailErrorMsg,
            data: {
                id: contact._id,
                name: contact.name,
                email: contact.email,
                createdAt: contact.createdAt
            }
        });

    } catch (error) {
        console.error(`[Database Error] Failed to complete transaction: ${error.message}`);
        res.status(500);
        return next(new Error('Failed to process your submission. Please try again.'));
    }
};

module.exports = {
    submitContact
};
