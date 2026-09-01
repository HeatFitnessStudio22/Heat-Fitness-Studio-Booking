"use client";

import { useEffect, useState } from "react";

export type Lang = "el" | "en";

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("el");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("heat-lang") as Lang | null) : null;
    if (saved === "el" || saved === "en") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("heat-lang", l);
  }

  return [lang, setLang];
}

type Dict = Record<string, { el: string; en: string }>;

export const T: Dict = {
  login: { el: "Σύνδεση", en: "Log in" },
  register: { el: "Εγγραφή", en: "Sign up" },
  email: { el: "Email", en: "Email" },
  password: { el: "Κωδικός", en: "Password" },
  fullName: { el: "Όνομα", en: "Full name" },
  emailPlaceholder: { el: "π.χ. giorgos@example.com", en: "e.g. john@example.com" },
  namePlaceholder: { el: "π.χ. Γιώργος Παπαδόπουλος", en: "e.g. John Smith" },
  wrongCreds: { el: "Λάθος email ή κωδικός.", en: "Wrong email or password." },
  noAccount: { el: "Δεν έχετε λογαριασμό;", en: "Don't have an account?" },
  haveAccount: { el: "Έχετε ήδη λογαριασμό;", en: "Already have an account?" },
  forgotPassword: { el: "Ξέχασα τον κωδικό μου", en: "Forgot your password?" },
  somethingWrong: { el: "Κάτι πήγε στραβά.", en: "Something went wrong." },
  resetPasswordTitle: { el: "Επαναφορά κωδικού", en: "Reset password" },
  resetPasswordDesc: {
    el: "Δώσε το email σου και θα σου στείλουμε σύνδεσμο επαναφοράς κωδικού.",
    en: "Enter your email and we'll send you a password reset link.",
  },
  sendResetLink: { el: "Αποστολή συνδέσμου", en: "Send reset link" },
  resetLinkSent: {
    el: "Αν το email υπάρχει στο σύστημά μας, θα λάβετε σύνδεσμο επαναφοράς.",
    en: "If that email exists in our system, you'll receive a reset link.",
  },
  newPassword: { el: "Νέος κωδικός", en: "New password" },
  setNewPassword: { el: "Ορισμός νέου κωδικού", en: "Set new password" },
  passwordResetOk: {
    el: "Ο κωδικός σας άλλαξε! Μπορείτε τώρα να συνδεθείτε.",
    en: "Your password has been changed! You can now log in.",
  },
  invalidOrExpired: {
    el: "Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει.",
    en: "This link is invalid or has expired.",
  },
  bookingTitle: { el: "Κρατηση Ραντεβου", en: "Book an Appointment" },
  pickDay: { el: "Επιλεξε Ημερα", en: "Pick a Day" },
  availableHours: { el: "Διαθεσιμεσ Ωρεσ", en: "Available Times" },
  full: { el: "Γεμάτο", en: "Full" },
  spots: { el: "θέσεις", en: "spots" },
  declareInterest: { el: "Δήλωση ενδιαφέροντος", en: "Join waitlist" },
  willNotify: { el: "Θα ειδοποιηθείτε ✓", en: "You'll be notified ✓" },
  loading: { el: "Φόρτωση...", en: "Loading..." },
  closedToday: { el: "Κλειστά αυτή την ημέρα.", en: "Closed on this day." },
  cancelPolicy: {
    el: "Ακύρωση δέχεται μέχρι 4 ώρες πριν το ραντεβού (ή έως 1,5 ώρα αν υπάρχει λίστα αναμονής για την ώρα σας). Μετά από αυτό το όριο, το ραντεβού χρεώνεται κανονικά.",
    en: "Cancellations are accepted up to 4 hours before the appointment (or up to 1.5 hours if there's a waitlist for your slot). After that, the appointment is charged as normal.",
  },
  cancel: { el: "Άκυρο", en: "Cancel" },
  confirmBooking: { el: "Κλείσε ραντεβού", en: "Confirm booking" },
  bookingConfirmed: { el: "Το ραντεβού σας κλείστηκε!", en: "Your appointment is booked!" },
  myBookings: { el: "Τα Ραντεβου Μου", en: "My Bookings" },
  noBookings: { el: "Δεν έχετε κλεισμένα ραντεβού.", en: "You have no upcoming bookings." },
  cancelBooking: { el: "Ακύρωση", en: "Cancel" },
  yourBooking: { el: "Το ραντεβού σας ✓", en: "Your booking ✓" },
  signOut: { el: "Αποσύνδεση", en: "Sign out" },
};

export const DAY_LABELS_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function t(key: keyof typeof T, lang: Lang) {
  return T[key][lang];
}

