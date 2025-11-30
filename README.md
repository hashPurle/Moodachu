# Moodachu
The Zero-Knowledge Emotional Mediator

## Local Email (Development)

By default, Moodachu uses Ethereal (a dev/test SMTP service) to capture sent emails and provide a preview link. This means emails are not delivered to the recipient's real mailbox in development — instead, the server prints a preview link to the console and returns a `preview` field in the response.

To send real emails to recipients (for testing with real mailboxes/providers like SendGrid or Mailgun):

1. Provide SMTP configuration in your environment, for example by setting these environment variables before starting the server:

```bash
export SMTP_HOST=smtp.sendgrid.net
export SMTP_PORT=587
export SMTP_USER=apikey
export SMTP_PASS=YOUR_SENDGRID_API_KEY
export FROM_EMAIL=no-reply@yourdomain.com
```

2. Restart the server. If these variables are set, Nodemailer will use the configured SMTP provider and deliver emails to the recipient's mailbox. If not set, Ethereal will be used and a preview link will be returned.

3. In development/demo, use Ethereal to inspect what would be delivered without sending real mail.

## Username invites

By default, Moodachu now uses username-based invites (no emails are sent for invite requests). The flow is:

- Each user is assigned a unique `username` on first login/signup via the simulator server. This mapping is stored in the server state and used for invites.
- To send an invite, provide the partner's username rather than an email address in the dashboard. The server will validate the username exists when creating an invite.
- The recipient will see the invite on their Dashboard when logged in; the server stores pending invites under `invitations` addressed to a `username`.

To check or change a user's username mapping, use the `GET /users/:uid` and `POST /users` endpoints in the simulator.

