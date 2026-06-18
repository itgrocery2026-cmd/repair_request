'use client'

import { useState } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

const selectClass =
  'border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function nowHour() {
  return String(new Date().getHours()).padStart(2, '0')
}

function nowMinute() {
  const m = new Date().getMinutes()
  return MINUTES.find((x) => parseInt(x) >= m) ?? '00'
}

interface Props {
  noteLabel?: string
  notePlaceholder?: string
  minDate?: string
}

export default function SlaFormFields({ noteLabel = 'หมายเหตุ', notePlaceholder = 'ไม่บังคับ', minDate }: Props) {
  const [date, setDate] = useState(todayStr())
  const [hour, setHour] = useState(nowHour())
  const [minute, setMinute] = useState(nowMinute())

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          กำหนดวันเสร็จ <span className="text-red-500">*</span>
        </label>
        <input
          name="slaDate"
          type="date"
          required
          value={date}
          min={minDate ?? todayStr()}
          onChange={(e) => setDate(e.target.value)}
          className={`w-full ${selectClass}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          เวลา <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 items-center">
          <select
            name="slaHour"
            required
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className={selectClass}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{h} น.</option>
            ))}
          </select>
          <span className="text-gray-400">:</span>
          <select
            name="slaMinute"
            required
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className={selectClass}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>{m} นาที</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{noteLabel}</label>
        <input
          name="slaNote"
          placeholder={notePlaceholder}
          className={`w-full ${selectClass}`}
        />
      </div>
    </>
  )
}
