'use client'

import { useState } from 'react'

export type Address = {
  _id?: string
  label?: string
  fullName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  isDefault?: boolean
}

type Props = {
  initial?: Partial<Address>
  onSubmit: (data: Address) => Promise<void> | void
  onCancel: () => void
  saving?: boolean
  showDefaultToggle?: boolean
}

export default function AddressForm({
  initial,
  onSubmit,
  onCancel,
  saving,
  showDefaultToggle = true,
}: Props) {
  const [form, setForm] = useState<Address>({
    label: initial?.label ?? 'Home',
    fullName: initial?.fullName ?? '',
    phone: initial?.phone ?? '',
    line1: initial?.line1 ?? '',
    line2: initial?.line2 ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    postalCode: initial?.postalCode ?? '',
    isDefault: !!initial?.isDefault,
    _id: initial?._id,
  })

  const onChange =
    (k: keyof Address) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v =
        e.target.type === 'checkbox' ? (e.target as any).checked : e.target.value
      setForm((s) => ({ ...s, [k]: v as any }))
    }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Label
          <input
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2"
            value={form.label || ''}
            onChange={onChange('label')}
            placeholder="Home / Work / Other"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Full name
          <input
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2"
            value={form.fullName}
            onChange={onChange('fullName')}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Phone
        <input
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2"
          value={form.phone}
          onChange={onChange('phone')}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Address line 1
        <input
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2"
          value={form.line1}
          onChange={onChange('line1')}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Address line 2 (optional)
        <input
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2"
          value={form.line2 || ''}
          onChange={onChange('line2')}
        />
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          City
          <input
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2"
            value={form.city}
            onChange={onChange('city')}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          State
          <input
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2"
            value={form.state}
            onChange={onChange('state')}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Postal code
          <input
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2"
            value={form.postalCode}
            onChange={onChange('postalCode')}
            required
          />
        </label>
      </div>

      {showDefaultToggle && (
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={!!form.isDefault}
            onChange={onChange('isDefault')}
          />
          Set as default
        </label>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
