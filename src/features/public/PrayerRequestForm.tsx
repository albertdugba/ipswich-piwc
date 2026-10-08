import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckIcon, HugeiconsIcon, PrayerIcon, SpinnerIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { submitPrayerRequest } from '@/lib/firestore/prayer-requests'
import {
  prayerRequestSchema,
  type PrayerRequestInput,
  type PrayerRequestValues,
} from '@/domain/prayer-request'
import { Container, DisplayHeading, Eyebrow, Section } from './primitives'
import { Reveal } from './motion'

// Boxed fields: soft fill at rest, white with a royal-blue border when
// focused, red border when the field has an error (aria-invalid).
const fieldClass =
  'mt-2 w-full rounded-xl border-[1.8px] border-stone-200 bg-stone-50/70 px-4 py-3 text-base text-ink placeholder:text-stone-400 transition-[border-color,background-color] duration-200 ease-out hover:border-stone-300 focus:border-brand-500 focus:bg-white focus:outline-none aria-invalid:border-red-400'

/**
 * "How can we pray for you?" — public prayer request. People choose to share
 * their name or stay anonymous; requests go privately to the pastoral team.
 */
export function PrayerRequestSection() {
  return (
    <Section id="prayer" className="bg-paper">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <Eyebrow>Prayer</Eyebrow>
          <DisplayHeading className="mt-4">
            How can we pray for you?
          </DisplayHeading>
          <p className="mt-5 max-w-md type-lead text-stone-600">
            Whatever you’re carrying, you don’t have to carry it alone. Our
            pastoral team prays over every request.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-stone-600">
            {[
              'Kept private — never shown on the website',
              'Stay anonymous if you prefer',
              'Leave your number if you’d like a call back',
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-gold-500 text-gold-600">
                  <HugeiconsIcon icon={CheckIcon} className="size-3" />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="lg:col-span-7" delay={0.1}>
          <PrayerRequestForm />
        </Reveal>
      </Container>
    </Section>
  )
}

function PrayerRequestForm() {
  const reduce = useReducedMotion()
  const [sent, setSent] = useState(false)
  const form = useForm<PrayerRequestInput, unknown, PrayerRequestValues>({
    resolver: zodResolver(prayerRequestSchema),
    defaultValues: { request: '', anonymous: false, name: '', phone: '' },
  })
  const anonymous = form.watch('anonymous')
  const errors = form.formState.errors

  const submit = useMutation({
    mutationFn: submitPrayerRequest,
    onSuccess: () => {
      setSent(true)
      form.reset()
    },
  })

  if (sent) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start gap-4 rounded-2xl bg-white p-8 shadow-sm border border-stone-200 sm:p-10"
        role="status"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-600 text-white">
          <HugeiconsIcon icon={PrayerIcon} className="size-6" />
        </span>
        <p className="type-h3 text-ink">Thank you — we’re praying with you.</p>
        <p className="text-stone-600">
          Your request has reached our pastoral team.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-2 border-b-2 border-gold-400 pb-0.5 text-sm font-semibold text-ink"
        >
          Send another request
        </button>
      </motion.div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => submit.mutate(values))}
      className="rounded-2xl bg-white p-6 shadow-sm border border-stone-200 sm:p-10"
    >
      <fieldset>
        <legend className="text-sm font-semibold text-ink">
          How would you like to send this?
        </legend>
        <div
          role="radiogroup"
          className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-stone-100 p-1"
        >
          {[
            { value: false, label: 'With my name' },
            { value: true, label: 'Anonymously' },
          ].map((opt) => {
            const active = anonymous === opt.value
            return (
              <button
                key={opt.label}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() =>
                  form.setValue('anonymous', opt.value, {
                    shouldValidate: form.formState.isSubmitted,
                  })
                }
                className={cn(
                  'h-11 rounded-full text-sm font-semibold transition-all',
                  active
                    ? 'bg-white text-ink shadow-sm border border-stone-200'
                    : 'text-stone-500 hover:text-ink',
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <motion.div
        initial={false}
        animate={{
          height: anonymous ? 0 : 'auto',
          opacity: anonymous ? 0 : 1,
        }}
        transition={{ duration: reduce ? 0 : 0.3, ease: 'easeOut' }}
        className="overflow-hidden"
        aria-hidden={anonymous}
      >
        <div className="grid gap-x-6 pt-4 sm:grid-cols-2">
          <Field label="Your name" error={errors.name?.message}>
            <input
              {...form.register('name')}
              aria-invalid={Boolean(errors.name)}
              autoComplete="name"
              tabIndex={anonymous ? -1 : 0}
              placeholder="First name is fine"
              className={fieldClass}
            />
          </Field>
          <Field label="Phone number (optional)" error={errors.phone?.message}>
            <input
              {...form.register('phone')}
              type="tel"
              inputMode="tel"
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              tabIndex={anonymous ? -1 : 0}
              placeholder="e.g. 07700 900123"
              className={fieldClass}
            />
          </Field>
        </div>
      </motion.div>

      {anonymous ? (
        <p className="mt-4 rounded-lg bg-stone-100 px-4 py-3 text-sm text-stone-600">
          We won’t know who sent this — and that’s okay. We’ll still pray.
        </p>
      ) : null}

      <Field label="Your prayer request" error={errors.request?.message}>
        <textarea
          {...form.register('request')}
          aria-invalid={Boolean(errors.request)}
          rows={5}
          placeholder="Share as much or as little as you like…"
          className={cn(fieldClass, 'resize-none')}
        />
      </Field>

      {submit.isError ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          Sorry, that didn’t send. Please try again in a moment.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submit.isPending}
        className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-7 text-sm font-semibold text-white transition-[color,background-color,border-color,scale] duration-200 ease-out active:scale-[0.97] hover:bg-brand-700 disabled:opacity-70 sm:w-auto"
      >
        {submit.isPending ? (
          <HugeiconsIcon icon={SpinnerIcon} className="size-4 animate-spin" />
        ) : (
          <HugeiconsIcon icon={PrayerIcon} className="size-4" />
        )}
        Send prayer request
      </button>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="mt-5 block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-sm text-red-700">{error}</span>
      ) : null}
    </label>
  )
}
