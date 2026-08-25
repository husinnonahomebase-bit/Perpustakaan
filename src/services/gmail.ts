// Gmail API Integration Service using Client-Side Bearer Token

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
  fromName?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
}

function makeRawEmail(to: string, subject: string, htmlMessage: string, fromName: string = 'Perpustakaan SMA Negeri Lumina'): string {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    htmlMessage,
  ];

  const email = emailLines.join('\r\n');
  return btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmailNotice(
  accessToken: string,
  params: SendEmailParams
): Promise<GmailMessage> {
  const raw = makeRawEmail(params.to, params.subject, params.bodyHtml, params.fromName);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gmail API send error: ${res.status}`);
  }

  return await res.json();
}

export function generateOverdueEmailHtml(memberName: string, bookTitle: string, dueDate: string, fineAmount: number, trxCode: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.02em;">Lumina Smart Library</h2>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 14px;">SMA Negeri Lumina Bangsa - Sistem Sirkulasi Mandiri</p>
      </div>
      <div style="padding: 28px;">
        <h3 style="color: #b91c1c; margin-top: 0; font-size: 18px;">Pemberitahuan: Masa Pinjam Buku Telah Melewati Jatuh Tempo</h3>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Halo <strong>${memberName}</strong>,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Kami menginformasikan bahwa peminjaman buku berikut telah melewati tanggal batas pengembalian:
        </p>
        <div style="background: #f8fafc; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <table style="width: 100%; font-size: 14px; color: #334155;">
            <tr><td style="padding: 4px 0; color: #64748b; width: 140px;">Nomor Transaksi:</td><td style="font-weight: 600;">${trxCode}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Judul Buku:</td><td style="font-weight: 600;">${bookTitle}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Tanggal Jatuh Tempo:</td><td style="color: #dc2626; font-weight: 600;">${dueDate}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Akumulasi Denda:</td><td style="font-weight: 600; color: #b91c1c;">Rp ${fineAmount.toLocaleString('id-ID')}</td></tr>
          </table>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Mohon segera mengembalikan buku ke konter perpustakaan pusat atau melalui <strong>Lumina Smart Drop Box 24 Jam</strong> untuk menghindari penambahan denda harian.
        </p>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          Email otomatis dikirim melalui Integrasi Gmail Sistem Perpustakaan Lumina.<br/>
          Jika sudah mengembalikan, mohon abaikan pesan ini.
        </div>
      </div>
    </div>
  `;
}
