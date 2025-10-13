import nodemailer from "nodemailer";

//http://localhost:3000/api/test-email

export async function POST(req: Request) {
  const { to } = await req.json();

  if (!to) {
    return Response.json({ error: "Thiếu địa chỉ email 'to'" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject: "Đây là email test từ hệ thống Sổ Liên Lạc điện tử",
      html: `<h3>Xin chào!</h3><p>Đây là email test từ hệ thống Sổ Liên Lạc điện tử.</p>`,
    });

    console.log("Email sent:", info.messageId);
    return Response.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Error sending email:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
