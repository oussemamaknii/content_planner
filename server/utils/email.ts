import nodemailer from 'nodemailer'

export async function sendEmail(to: string, subject: string, html: string) {
  const server = process.env.EMAIL_SERVER
  const from = process.env.EMAIL_FROM
  if (!server || !from) {
    // eslint-disable-next-line no-console
    console.log('[email] EMAIL_SERVER/EMAIL_FROM not configured; skipping email to', to)
    return false
  }
  const transporter = nodemailer.createTransport(server)
  await transporter.sendMail({ from, to, subject, html })
  return true
}


