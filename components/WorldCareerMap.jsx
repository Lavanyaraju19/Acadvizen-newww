'use client'

import Image from 'next/image'

const worldShapes = [
  {
    id: 'north-america',
    fill: '#4285f4',
    d: 'M110 110 C155 70, 245 72, 286 110 C317 138, 320 178, 286 208 C258 232, 209 227, 188 246 C171 260, 168 286, 142 298 C117 309, 82 301, 66 277 C50 252, 58 216, 81 192 C100 171, 108 145, 110 110 Z',
  },
  {
    id: 'south-america',
    fill: '#4285f4',
    d: 'M235 274 C268 268, 300 283, 315 316 C330 350, 320 388, 294 424 C279 445, 274 468, 258 486 C241 505, 214 508, 200 490 C184 468, 194 438, 205 414 C217 387, 220 366, 214 337 C209 315, 213 290, 235 274 Z',
  },
  {
    id: 'greenland',
    fill: '#d1dae6',
    d: 'M300 60 C328 45, 366 49, 388 73 C401 88, 397 109, 375 118 C350 128, 311 121, 296 100 C285 85, 286 68, 300 60 Z',
  },
  {
    id: 'europe',
    fill: '#4285f4',
    d: 'M465 121 C497 101, 541 100, 572 117 C594 130, 603 149, 594 168 C583 191, 548 196, 523 191 C499 187, 476 175, 459 160 C446 147, 449 131, 465 121 Z',
  },
  {
    id: 'africa',
    fill: '#4285f4',
    d: 'M503 196 C542 185, 586 202, 607 236 C629 272, 626 319, 604 361 C587 394, 554 423, 522 420 C489 416, 463 379, 454 341 C446 305, 451 271, 463 238 C472 215, 483 201, 503 196 Z',
  },
  {
    id: 'middle-east',
    fill: '#4285f4',
    d: 'M590 189 C612 180, 638 182, 655 197 C668 208, 672 223, 663 236 C651 251, 627 255, 607 248 C587 241, 575 227, 576 210 C577 199, 582 192, 590 189 Z',
  },
  {
    id: 'asia',
    fill: '#4285f4',
    d: 'M603 116 C664 83, 762 83, 825 113 C874 137, 902 175, 886 213 C873 244, 825 257, 782 251 C749 247, 724 256, 706 276 C686 296, 651 304, 627 291 C606 279, 600 253, 590 232 C579 208, 558 188, 554 162 C551 141, 568 124, 603 116 Z',
  },
  {
    id: 'southeast-asia',
    fill: '#4285f4',
    d: 'M739 282 C759 273, 787 276, 801 293 C813 307, 812 329, 795 341 C777 353, 749 352, 733 339 C720 327, 720 296, 739 282 Z',
  },
  {
    id: 'australia',
    fill: '#4285f4',
    d: 'M786 380 C817 362, 862 364, 891 383 C910 396, 916 417, 904 435 C889 458, 854 467, 821 461 C787 455, 761 433, 760 410 C760 397, 770 389, 786 380 Z',
  },
  {
    id: 'japan',
    fill: '#4285f4',
    d: 'M828 189 C838 182, 851 184, 858 194 C863 203, 859 215, 849 221 C839 227, 825 224, 819 214 C814 204, 818 195, 828 189 Z',
  },
]

const learnerMarkers = [
  {
    id: 'americas',
    region: 'Americas',
    learners: '30,161',
    growth: '+15%',
    avatar: '/images/success/success1.jpg',
    pin: { x: 20, y: 43 },
    card: { x: 9, y: 12 },
  },
  {
    id: 'emea',
    region: 'EMEA',
    learners: '52,001',
    growth: '+10%',
    avatar: '/images/success/success2.jpg',
    pin: { x: 56, y: 60 },
    card: { x: 47, y: 52 },
  },
  {
    id: 'apac',
    region: 'APAC',
    learners: '7,990',
    growth: '+13%',
    avatar: '/images/success/success3.jpg',
    pin: { x: 82, y: 36 },
    card: { x: 70, y: 16 },
  },
]

export default function WorldCareerMap() {
  return (
    <div className="relative w-full overflow-hidden rounded-[30px] border border-cyan-300/20 bg-[radial-gradient(circle_at_14%_14%,rgba(14,116,144,0.25),transparent_26%),radial-gradient(circle_at_86%_78%,rgba(67,56,202,0.24),transparent_34%),linear-gradient(120deg,rgba(2,10,27,0.97),rgba(5,19,46,0.96)_44%,rgba(15,23,56,0.94))] p-4 md:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative h-[280px] sm:h-[340px] md:h-[430px]">
        <div className="absolute inset-0 rounded-2xl border border-white/10 bg-slate-950/25" />
        <div className="absolute inset-0">
          <svg
            viewBox="0 0 1000 520"
            className="h-full w-full"
            role="img"
            aria-label="Illustrated world map showing Acadvizen learner activity across global regions"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient id="oceanGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(56,189,248,0.12)" />
                <stop offset="100%" stopColor="rgba(15,23,42,0)" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="1000" height="520" fill="url(#oceanGlow)" />
            {worldShapes.map((shape) => (
              <path
                key={shape.id}
                d={shape.d}
                fill={shape.fill}
                stroke="#203252"
                strokeWidth="8"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity="0.96"
              />
            ))}
          </svg>
        </div>

        <div className="absolute inset-0 hidden md:block">
          {learnerMarkers.map((marker, idx) => (
            <div key={`${marker.id}-pin`} className="absolute" style={{ left: `${marker.pin.x}%`, top: `${marker.pin.y}%` }}>
              <span
                className="absolute -left-7 -top-7 h-14 w-14 rounded-full bg-cyan-300/30 animate-ping"
                style={{ animationDelay: `${idx * 0.4}s` }}
              />
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-cyan-200/70 bg-cyan-300/85 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
              <span className="absolute left-6 -top-5 rounded-full border border-emerald-200/70 bg-emerald-300/95 px-2 py-0.5 text-[10px] font-semibold text-emerald-950">
                {marker.growth}
              </span>
            </div>
          ))}

          {learnerMarkers.map((marker) => (
            <div
              key={`${marker.id}-card`}
              className="absolute"
              style={{ left: `${marker.card.x}%`, top: `${marker.card.y}%` }}
            >
              <div className="rounded-2xl border border-white/25 bg-white/95 px-4 py-3 text-slate-900 shadow-[0_15px_40px_rgba(2,6,23,0.38)]">
                <div className="flex min-w-[190px] items-center gap-3">
                  <Image
                    src={marker.avatar}
                    alt={`${marker.region} learner`}
                    width={38}
                    height={38}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-2xl font-bold leading-none">{marker.learners}</div>
                    <div className="text-xs font-medium text-slate-600">Learners</div>
                  </div>
                  <div className="ml-auto rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    {marker.growth}
                  </div>
                </div>
              </div>
              <div className="ml-10 mt-[-5px] h-3 w-3 rotate-45 border-b border-r border-slate-300 bg-white/95" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 md:hidden">
        {learnerMarkers.map((marker) => (
          <div
            key={`${marker.id}-mobile`}
            className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3"
          >
            <Image
              src={marker.avatar}
              alt={`${marker.region} learner`}
              width={34}
              height={34}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="text-slate-100">
              <div className="text-sm font-semibold">{marker.region}</div>
              <div className="text-xs text-slate-300">{marker.learners} Learners</div>
            </div>
            <div className="ml-auto rounded-full border border-emerald-200/50 bg-emerald-300/20 px-2 py-1 text-xs font-semibold text-emerald-200">
              {marker.growth}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
