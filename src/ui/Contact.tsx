import { useState } from 'react'
import { PROFILE } from '../content/profile'

export function CopyEmail({ tone = 'tag' }: { tone?: 'tag' | 'plate' }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email)
    } catch {
      const t = document.createElement('textarea')
      t.value = PROFILE.email
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }
  const dark = tone === 'plate'
  return (
    <div className={`flex items-stretch overflow-hidden rounded-[3px] border-2 ${dark ? 'border-[#d6cfbd]' : 'border-ink'}`}>
      <a href={`mailto:${PROFILE.email}`} className={`reading min-w-0 flex-1 truncate px-3 py-2.5 text-[0.92rem] no-underline ${dark ? 'text-engrave' : 'text-ink'}`}>
        {PROFILE.email}
      </a>
      <button
        type="button"
        onClick={copy}
        className={`engraved min-w-[6.5rem] px-3 text-[0.82rem] font-extrabold transition-colors ${
          copied ? 'bg-go text-go-ink' : dark ? 'bg-engrave text-ink hover:bg-white' : 'bg-ink text-tag hover:bg-[#2a2a2a]'
        }`}
        aria-live="polite"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export function ContactActions() {
  return (
    <div className="space-y-2">
      <CopyEmail />
      <div className="grid grid-cols-2 gap-2">
        <a
          href={PROFILE.linkedin}
          target="_blank"
          rel="noreferrer"
          className="engraved grid place-items-center rounded-[3px] bg-ink px-3 py-2.5 text-[0.86rem] font-extrabold text-tag no-underline transition-colors hover:bg-[#2a2a2a]"
        >
          LinkedIn
        </a>
        {PROFILE.cv ? (
          <a
            href={PROFILE.cv}
            download
            className="engraved grid place-items-center rounded-[3px] bg-go px-3 py-2.5 text-[0.86rem] font-extrabold text-go-ink no-underline transition-colors hover:bg-[#28825a]"
          >
            Download CV
          </a>
        ) : (
          <a
            href={`mailto:${PROFILE.email}?subject=CV%20request`}
            className="engraved grid place-items-center rounded-[3px] bg-go px-3 py-2.5 text-[0.86rem] font-extrabold text-go-ink no-underline transition-colors hover:bg-[#28825a]"
          >
            Ask for my CV
          </a>
        )}
      </div>
    </div>
  )
}

export function PathList() {
  return (
    <ol className="space-y-2">
      {PROFILE.path.map((p) => (
        <li key={p.what} className="grid grid-cols-[6.2rem_1fr] gap-3 text-[0.92rem] leading-snug">
          <span className="reading text-[0.8rem] text-ink-2">{p.years}</span>
          <span>
            {p.what}
            <span className="text-ink-2"> · {p.where}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
