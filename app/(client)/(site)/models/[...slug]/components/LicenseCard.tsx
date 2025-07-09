import Link from 'next/link'

export default function LicenseCard() {
  return (
    <div className="box-border flex w-full flex-col gap-3 rounded-[12px] bg-background p-4 dark:bg-card">
      <div className="w-full text-[14px] font-semibold text-text-primary">
        License
      </div>
      <div className="flex flex-col gap-3">
        <Link href="https://creativecommons.org/licenses/by-nc/4.0/">
          <img
            src="https://pub-c6657a8ca5ae479391474fda6501e587.r2.dev/cc/cc_by_nc.png"
            alt=""
            width={120}
          />
        </Link>
        <p className="text-[12px] leading-4.5 font-medium text-text-secondary">
          This license allows reusers to distribute, remix, adapt, and build
          upon the material in any medium or format for noncommercial purposes
          only, and only so long as attribution is given to the creator.
        </p>
      </div>
    </div>
  )
}
