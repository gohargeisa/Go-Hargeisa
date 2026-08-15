/**
 * The doctors/appointments engine (departments, doctors, appointments
 * tables) is shared by every city_services category with
 * `categories.supports_appointments = true` — originally Hospital/Clinic
 * only, now also Beauty Salon. The tables and RPC are fully generic, but
 * the "appointments" translation namespace's default copy reads as medical
 * ("Doctor", "Patient", a stethoscope icon). This resolves which category
 * slugs should keep that medical vocabulary vs. the generic staff/customer
 * vocabulary — add a slug here only if it's genuinely a medical practice;
 * every other appointments-enabled category defaults to generic.
 */
const MEDICAL_APPOINTMENT_CATEGORIES = new Set(["hospital", "clinic"]);

export function isMedicalAppointmentCategory(categorySlug: string | undefined): boolean {
  return !!categorySlug && MEDICAL_APPOINTMENT_CATEGORIES.has(categorySlug);
}
