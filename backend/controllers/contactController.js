/**
 * -------------------------------------------------------------
 * Contact Controller (Logic for processing contact submissions)
 * -------------------------------------------------------------
 */

const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const dns = require('dns');
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

        // 3. Configure Nodemailer Transporter using Gmail SMTP App Passwords (with Ethereal developer fallback)
        let transporter;
        let isTestAccount = false;
        const testUserPlaceholder = 'your-gmail@gmail.com';
        const testPassPlaceholder = 'your-16-character-app-password';

        if (!process.env.EMAIL_USER ||
            process.env.EMAIL_USER === testUserPlaceholder ||
            !process.env.EMAIL_PASS ||
            process.env.EMAIL_PASS === testPassPlaceholder) {

            console.log('[SMTP] No production credentials detected. Generating Ethereal SMTP test credentials...');
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            isTestAccount = true;
        } else {
            let resolvedHost = 'smtp.gmail.com';
            try {
                // Force resolving to an IPv4 address to avoid IPv6 connection issues
                const dnsResult = await dns.promises.lookup('smtp.gmail.com', { family: 4 });
                if (dnsResult && dnsResult.address) {
                    resolvedHost = dnsResult.address;
                    console.log(`[SMTP] Local DNS resolved smtp.gmail.com to: ${resolvedHost}`);

                    // If the resolved IP starts with 192.168. (which is unroutable or conflicts with local subnets on some networks),
                    // we fall back to a known-stable public Google SMTP IP address.
                    if (resolvedHost.startsWith('192.168.')) {
                        const fallbackIPs = [
                            '142.250.192.108',
                            '74.125.136.108',
                            '64.233.184.108',
                            '173.194.79.108'
                        ];
                        resolvedHost = fallbackIPs[Math.floor(Math.random() * fallbackIPs.length)];
                        console.log(`[SMTP Warning] Resolved IP was in local/problematic subnet. Switched to stable Google SMTP IP: ${resolvedHost}`);
                    }
                }
            } catch (dnsError) {
                console.warn(`[SMTP Warning] DNS lookup failed, falling back to hostname: ${dnsError.message}`);
            }

            const cleanPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';
            transporter = nodemailer.createTransport({
                host: resolvedHost,
                port: 587,
                secure: false, // Use STARTTLS
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: cleanPass
                },
                tls: {
                    servername: 'smtp.gmail.com',
                    rejectUnauthorized: true
                },
                connectionTimeout: 10000, // 10s connection timeout
                greetingTimeout: 10000,
                socketTimeout: 15000
            });
        }

        const senderAddress = isTestAccount ? `"Portfolio Test" <${transporter.options.auth.user}>` : `"${name} via Portfolio" <${process.env.EMAIL_USER}>`;
        const ownerEmailAddress = isTestAccount ? transporter.options.auth.user : (process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER);
        const visitorConfirmationSender = isTestAccount ? `"Iniyavan (Test)" <${transporter.options.auth.user}>` : `"Iniyavan" <${process.env.EMAIL_USER}>`;

        // 4. Draft notification email (To You, the website owner)
        const notificationMailOptions = {
            from: senderAddress,
            to: ownerEmailAddress,
            replyTo: email,
            subject: `💼 New Portfolio Message: ${subject}`,
            html: `
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

        // 5. Draft confirmation auto-reply email (To the visitor)
        const confirmationMailOptions = {
            from: visitorConfirmationSender,
            to: email,
            subject: `👋 Thank you for reaching out, ${name}!`,
            html: `
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

        // 6. Verify SMTP transporter and send notification and confirmation emails sequentially
        let emailSent = false;
        let emailErrorMsg = '';
        let notificationSent = false;
        let confirmationSent = false;

        try {
            // Verify transporter connection configuration
            await transporter.verify();
            console.log('[SMTP] Connection verified successfully and ready to dispatch emails.');

            // Send Notification Email (to Owner)
            try {
                const sentNotification = await transporter.sendMail(notificationMailOptions);
                notificationSent = true;
                if (isTestAccount) {
                    console.log(`[SMTP] Test notification email successfully dispatched to Ethereal!`);
                    console.log(`  -> Notification Email Preview URL: ${nodemailer.getTestMessageUrl(sentNotification)}`);
                } else {
                    console.log(`[SMTP] Production notification email successfully sent.`);
                }
            } catch (notificationError) {
                console.error(`[SMTP Error] Failed to send notification email: ${notificationError.message}`);
                emailErrorMsg += `Notification Email: ${notificationError.message}. `;
            }

            // Send Confirmation Email (to Visitor)
            try {
                const sentConfirmation = await transporter.sendMail(confirmationMailOptions);
                confirmationSent = true;
                if (isTestAccount) {
                    console.log(`[SMTP] Test confirmation email successfully dispatched to Ethereal!`);
                    console.log(`  -> Confirmation Email Preview URL: ${nodemailer.getTestMessageUrl(sentConfirmation)}`);
                } else {
                    console.log(`[SMTP] Production confirmation email successfully sent to: ${email}`);
                }
            } catch (confirmationError) {
                console.error(`[SMTP Error] Failed to send confirmation email: ${confirmationError.message}`);
                emailErrorMsg += `Confirmation Email: ${confirmationError.message}. `;
            }

            emailSent = notificationSent && confirmationSent;
        } catch (smtpVerifyError) {
            console.warn(`[SMTP Warning] Transporter verification failed: ${smtpVerifyError.message}`);
            emailErrorMsg = `SMTP Verification: ${smtpVerifyError.message}`;
        }

        // 7. Send success JSON response to client
        res.status(201).json({
            success: true,
            message: emailSent
                ? 'Your message has been sent successfully! A confirmation email has been sent to your inbox.'
                : 'Your message was saved successfully! (However, we encountered a temporary issue sending email notifications).',
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
        console.error(`[SMTP/DB Error] Failed to complete transaction: ${error.message}`);
        res.status(500);
        return next(new Error('Failed to process your submission. Please try again.'));
    }
};

module.exports = {
    submitContact
};
