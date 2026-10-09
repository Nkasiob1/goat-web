"use client";                                              // reacts to typing and submitting, so it runs in the browser

import { useActionState } from "react";                    // runs a server action and remembers its result
import { submitEnquiry } from "../app/advertise/actions";

const fieldClass =                                         // one shared style for every input
  "mt-2 w-full rounded-xl border border-line bg-mist px-4 py-3 text-sm text-ink outline-none focus:border-moss";

export default function AdvertiseForm() {
  const [state, formAction, pending] = useActionState(submitEnquiry, null); // state = result, pending = saving

  if (state?.ok) {                                         // after success, swap the form for a thank-you
    return (
      <div className="rounded-3xl bg-sage p-10 text-center">
        <p className="text-lg font-semibold text-ink">Enquiry received</p>
        <p className="mt-2 text-sm text-stone">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-3xl border border-line bg-water p-6 md:p-8">
      <div className="grid gap-5 md:grid-cols-2">          {/* one column on phones, two on laptops */}
        <label className="text-sm font-medium text-ink">
          Company *
          <input name="company" required className={fieldClass} />
        </label>
        <label className="text-sm font-medium text-ink">
          Your name *
          <input name="contact_name" required className={fieldClass} />
        </label>
        <label className="text-sm font-medium text-ink">
          Work email *
          <input name="email" type="email" required className={fieldClass} />
        </label>
        <label className="text-sm font-medium text-ink">
          Website
          <input name="website" placeholder="https://" className={fieldClass} />
        </label>
      </div>

      <label className="mt-5 block text-sm font-medium text-ink">
        Licensed by
        <input name="regulator" placeholder="e.g. SEC Nigeria, FCA, CySEC" className={fieldClass} />
      </label>

      <label className="mt-5 block text-sm font-medium text-ink">
        Message
        <textarea name="message" rows={4} className={fieldClass} />
      </label>

      {state && !state.ok && (                             // show the error if the last attempt failed
        <p className="mt-4 text-sm text-loss">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}                                 // no double-clicks while saving
        className="mt-6 w-full rounded-full bg-forest px-6 py-3 text-sm font-medium text-water hover:bg-moss disabled:opacity-60 md:w-auto"
      >
        {pending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}