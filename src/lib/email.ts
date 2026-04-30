import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

function getGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<boolean> {
  try {
    const transporter = getGmailTransporter();
    await transporter.sendMail({
      from: `"مخزن منصور 🔐" <${GMAIL_USER}>`,
      to,
      subject: 'إعادة تعيين كلمة المرور — مخزن منصور',
      html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f0f4f8;border-radius:24px;overflow:hidden;border:1px solid #d1d9e6;">
          <div style="background:linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);padding:32px 24px;text-align:center;">
              <div style="font-size:54px;margin-bottom:12px;">🔐</div>
              <h1 style="color:white;margin:0;font-size:24px;font-weight:900;">إعادة تعيين كلمة المرور</h1>
              <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;font-weight:bold;">نظام إدارة مخزن منصور</p>
          </div>
          <div style="padding:32px 28px;background:white;">
              <p style="color:#334155;font-size:16px;line-height:1.8;margin:0 0 24px;text-align:right;">
                  وصلنا طلب لإعادة تعيين كلمة مرور حسابك في <strong>مخزن منصور</strong>. إذا كنت أنت من قام بهذا الطلب، يرجى الضغط على الزر أدناه:
              </p>
              <div style="text-align:center;margin-bottom:24px;">
                  <a href="${resetLink}"
                     target="_blank"
                     style="display:inline-block;background:#2563eb;color:white;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
                      تعيين كلمة مرور جديدة
                  </a>
              </div>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:24px;word-break:break-all;">
                <p style="margin:0 0 10px;color:#64748b;font-size:13px;text-align:right;">
                    إذا لم يعمل الزر أعلاه، قم بنسخ الرابط التالي ولصقه في المتصفح:
                </p>
                <a href="${resetLink}" target="_blank" style="color:#2563eb;font-size:12px;text-decoration:underline;">
                    ${resetLink}
                </a>
              </div>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;color:#166534;font-size:13px;text-align:center;">
                    🔒 هذا الرابط صالح لمدة <strong>ساعة واحدة</strong> فقط.<br>
                    إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة بأمان.
                </p>
              </div>
          </div>
          <div style="padding:20px;background:#f1f5f9;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;font-weight:bold;">© ${new Date().getFullYear()} مخزن منصور — إدارة المخازن والعمال</p>
          </div>
      </div>`,
    });
    console.log('[EMAIL] Reset email sent successfully to:', to);
    return true;
  } catch (err) {
    console.error('[EMAIL] Failed to send reset email:', err);
    return false;
  }
}
