"use server";                                              // everything in this file runs on the server only

import { supabase } from "../../lib/supabase";

export async function submitEnquiry(prevState, formData) { // prevState = last result; formData = what was typed
  const enquiry = {
    company: formData.get("company")?.trim(),              // .get reads a field by its name; .trim removes stray spaces
    contact_name: formData.get("contact_name")?.trim(),
    email: formData.get("email")?.trim(),
    website: formData.get("website")?.trim() || null,      // empty optional fields are saved as null
    regulator: formData.get("regulator")?.trim() || null,
    message: formData.get("message")?.trim() || null,
  };

  if (!enquiry.company || !enquiry.contact_name || !enquiry.email) {   // never trust the browser: check again here
    return { ok: false, message: "Please fill in your company, name and email." };
  }
  if (!/^\S+@\S+\.\S+$/.test(enquiry.email)) {             // simple shape check: something@something.something
    return { ok: false, message: "That email address doesn't look right." };
  }

  const { error } = await supabase.from("ad_enquiries").insert(enquiry); // save the row

  if (error) {
    console.error(error);                                  // details go to YOUR terminal, not the visitor
    return { ok: false, message: "Something went wrong. Please try again in a moment." };
  }

  return { ok: true, message: "Thank you. We'll be in touch within two working days." };
}