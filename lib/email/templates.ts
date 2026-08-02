import type { Locale } from "@/lib/i18n/config";

const SITE_NAME = "Go Hargeisa";
const BRAND_COLOR = "#0B5ED7";

function shell(locale: Locale, bodyHtml: string): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <body style="margin:0;padding:32px 16px;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr><td style="background:${BRAND_COLOR};padding:20px 28px;">
        <span style="color:#fff;font-size:18px;font-weight:700;">${SITE_NAME}</span>
      </td></tr>
      <tr><td style="padding:28px;">${bodyHtml}</td></tr>
    </table>
  </body>
</html>`;
}

const T = {
  bookingStatus: {
    en: (listing: string, status: string) => ({
      subject: `Booking update — ${listing}`,
      body: `<p>Your booking at <strong>${listing}</strong> is now <strong>${status}</strong>.</p>`,
    }),
    ar: (listing: string, status: string) => ({
      subject: `تحديث الحجز — ${listing}`,
      body: `<p>حجزك في <strong>${listing}</strong> أصبح الآن <strong>${status}</strong>.</p>`,
    }),
    so: (listing: string, status: string) => ({
      subject: `Cusboonaysiinta Ballanta — ${listing}`,
      body: `<p>Ballantaada ${listing} hadda waxay noqotay <strong>${status}</strong>.</p>`,
    }),
  },
  reviewReply: {
    en: (listing: string) => ({
      subject: `${listing} replied to your review`,
      body: `<p><strong>${listing}</strong> just replied to the review you left.</p>`,
    }),
    ar: (listing: string) => ({
      subject: `${listing} رد على تقييمك`,
      body: `<p>قام <strong>${listing}</strong> بالرد على التقييم الذي كتبته.</p>`,
    }),
    so: (listing: string) => ({
      subject: `${listing} ayaa uga jawaabay faalladaada`,
      body: `<p><strong>${listing}</strong> ayaa uga jawaabay faalladaada.</p>`,
    }),
  },
  accountVerified: {
    en: (listing: string) => ({
      subject: `${listing} is now verified`,
      body: `<p>Congratulations — <strong>${listing}</strong> is now an official Go Hargeisa partner.</p>`,
    }),
    ar: (listing: string) => ({
      subject: `تم توثيق ${listing}`,
      body: `<p>تهانينا — أصبح <strong>${listing}</strong> الآن شريكًا رسميًا في Go Hargeisa.</p>`,
    }),
    so: (listing: string) => ({
      subject: `${listing} hadda waa la xaqiijiyay`,
      body: `<p>Hambalyo — <strong>${listing}</strong> hadda waa lammaane rasmi ah oo Go Hargeisa.</p>`,
    }),
  },
  announcement: {
    en: (title: string, message: string) => ({ subject: title, body: `<p>${message}</p>` }),
    ar: (title: string, message: string) => ({ subject: title, body: `<p>${message}</p>` }),
    so: (title: string, message: string) => ({ subject: title, body: `<p>${message}</p>` }),
  },
  bookingReceived: {
    en: (listing: string, guest: string, checkIn: string, checkOut: string, reference: string) => ({
      subject: `New booking request — ${listing}`,
      body: `<p><strong>${guest}</strong> requested a booking at <strong>${listing}</strong>.</p><p>${checkIn} → ${checkOut}</p><p>Reference: ${reference}</p><p>Review it from your Go Hargeisa dashboard.</p>`,
    }),
    ar: (listing: string, guest: string, checkIn: string, checkOut: string, reference: string) => ({
      subject: `طلب حجز جديد — ${listing}`,
      body: `<p>قام <strong>${guest}</strong> بطلب حجز في <strong>${listing}</strong>.</p><p>${checkIn} → ${checkOut}</p><p>المرجع: ${reference}</p><p>راجع الطلب من لوحة تحكم Go Hargeisa الخاصة بك.</p>`,
    }),
    so: (listing: string, guest: string, checkIn: string, checkOut: string, reference: string) => ({
      subject: `Codsi Ballan Cusub — ${listing}`,
      body: `<p><strong>${guest}</strong> wuxuu codsaday ballan ${listing}.</p><p>${checkIn} → ${checkOut}</p><p>Tixraaca: ${reference}</p><p>Ka eeg codsiga dashboard-kaaga Go Hargeisa.</p>`,
    }),
  },
  bookingSubmitted: {
    en: (listing: string, checkIn: string, checkOut: string, reference: string) => ({
      subject: `Booking request received — ${listing}`,
      body: `<p>We've received your booking request at <strong>${listing}</strong>.</p><p>${checkIn} → ${checkOut}</p><p>Reference: <strong>${reference}</strong></p><p>The property will confirm your booking shortly — you'll get another email as soon as it's confirmed.</p>`,
    }),
    ar: (listing: string, checkIn: string, checkOut: string, reference: string) => ({
      subject: `تم استلام طلب الحجز — ${listing}`,
      body: `<p>لقد استلمنا طلب حجزك في <strong>${listing}</strong>.</p><p>${checkIn} → ${checkOut}</p><p>المرجع: <strong>${reference}</strong></p><p>سيقوم النزل بتأكيد حجزك قريبًا — ستصلك رسالة أخرى بمجرد تأكيده.</p>`,
    }),
    so: (listing: string, checkIn: string, checkOut: string, reference: string) => ({
      subject: `Codsiga Ballanta waa la Helay — ${listing}`,
      body: `<p>Waan helnay codsigaaga ballanta ee <strong>${listing}</strong>.</p><p>${checkIn} → ${checkOut}</p><p>Tixraaca: <strong>${reference}</strong></p><p>Meesha ayaa dhawaan xaqiijin doonta ballantaada — email kale ayaa kuu iman doona marka la xaqiijiyo.</p>`,
    }),
  },
};

export function bookingStatusEmail(locale: Locale, listing: string, status: string) {
  const { subject, body } = T.bookingStatus[locale](listing, status);
  return { subject, html: shell(locale, body) };
}

export function reviewReplyEmail(locale: Locale, listing: string) {
  const { subject, body } = T.reviewReply[locale](listing);
  return { subject, html: shell(locale, body) };
}

export function accountVerifiedEmail(locale: Locale, listing: string) {
  const { subject, body } = T.accountVerified[locale](listing);
  return { subject, html: shell(locale, body) };
}

export function announcementEmail(locale: Locale, title: string, message: string) {
  const { subject, body } = T.announcement[locale](title, message);
  return { subject, html: shell(locale, body) };
}

export function bookingReceivedEmail(locale: Locale, listing: string, guest: string, checkIn: string, checkOut: string, reference: string) {
  const { subject, body } = T.bookingReceived[locale](listing, guest, checkIn, checkOut, reference);
  return { subject, html: shell(locale, body) };
}

export function bookingSubmittedEmail(locale: Locale, listing: string, checkIn: string, checkOut: string, reference: string) {
  const { subject, body } = T.bookingSubmitted[locale](listing, checkIn, checkOut, reference);
  return { subject, html: shell(locale, body) };
}
