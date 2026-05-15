'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import '@/app/marketing.css';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Globe2,
  Menu,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

const LOGO_SRC = "/TF.svg";
const pages = ["Home", "Services", "Individuals", "Businesses", "Process", "Contact"];

const services = [
  { icon: FileText, title: "U.S. Tax Filing", text: "Federal and state tax return preparation for individuals, NRIs, students, professionals, and families.", tag: "Individuals" },
  { icon: Globe2, title: "FBAR & FATCA", text: "Foreign account and asset reporting support to help you stay compliant and avoid penalties.", tag: "Compliance" },
  { icon: BadgeCheck, title: "ITIN Guidance", text: "ITIN application, renewal, documentation, and filing guidance for dependents and non-residents.", tag: "ITIN" },
  { icon: Calculator, title: "Tax Planning Advisory", text: "Planning for deductions, credits, RSUs, stock options, rentals, investments, and cross-border cases.", tag: "Advisory" },
  { icon: Building2, title: "Business Tax Returns", text: "Tax preparation and planning for LLCs, S-Corps, partnerships, consultants, founders, and SMBs.", tag: "Business" },
  { icon: WalletCards, title: "Bookkeeping & Payroll", text: "Monthly books, payroll processing, year-end reports, and tax-ready financial records.", tag: "Operations" },
];

const individualServices = [
  "Form 1040 / 1040NR tax returns",
  "Multi-state tax filing",
  "Student and H-1B tax filing",
  "ITIN application and renewal guidance",
  "FBAR and FATCA reporting",
  "Extension filing support",
  "Tax notice and audit response support",
  "Tax planning for investments, rentals, and RSUs",
];
const businessServices = [
  "LLC, S-Corp, C-Corp and partnership tax returns",
  "Business incorporation guidance",
  "Monthly bookkeeping and reconciliation",
  "Payroll processing and filings",
  "1099 and contractor compliance",
  "Sales tax and state compliance coordination",
  "Year-end tax planning",
  "Financial reports for owners and founders",
];

const trustStats = [
  ["12,500+", "tax returns filed"],
  ["98.7%", "on-time filing rate"],
  ["24 hrs", "first draft turnaround"],
  ["4.9/5", "average client rating"],
];

const packages = [
  {
    name: "Starter",
    audience: "Simple W-2 filing",
    price: "$99",
    points: ["Federal return prep", "Basic state filing", "Standard deductions review", "Email support"],
  },
  {
    name: "Complete",
    audience: "NRI & multi-form filing",
    price: "$249",
    points: ["Federal + state filing", "Foreign reporting checks", "Credit and deduction optimization", "Priority tax expert review"],
    featured: true,
  },
  {
    name: "Business Pro",
    audience: "Founders and SMBs",
    price: "$499",
    points: ["Business return prep", "Bookkeeping quality check", "Payroll + compliance guidance", "Owner strategy call"],
  },
];

const compareRows = [
  ["Dedicated tax expert", "Yes", "Usually add-on", "Limited live support"],
  ["NRI / expat specialization", "Built-in", "Not primary focus", "Not primary focus"],
  ["Bookkeeping + payroll integration", "Included options", "Separate products", "Separate products"],
  ["IRS notice support", "Included", "Varies by package", "Varies by package"],
];

const testimonials = [
  { name: "Priya S.", role: "H-1B professional", quote: "I uploaded docs one evening and had a clean draft the next day with every assumption clearly explained." },
  { name: "Arjun K.", role: "Startup founder", quote: "Tax Filey combined my company filing, payroll, and personal return into one workflow. Huge time saver." },
  { name: "Neha R.", role: "NRI investor", quote: "Their FBAR and FATCA checklist caught issues I would have missed. Felt safe and in control throughout." },
];

const faqs = [
  { q: "How fast can you deliver a draft?", a: "Most standard returns get a first draft within 24 hours after complete document upload." },
  { q: "Do you handle complex NRI cases?", a: "Yes. We support NRIs with foreign account reporting, investments, rentals, and cross-border income situations." },
  { q: "Can you help if I received an IRS notice?", a: "Yes. Notice review and response support is available with guidance on next steps and required documents." },
  { q: "Do you only do annual filing?", a: "No. We support year-round planning, business bookkeeping, payroll, and quarterly estimate planning." },
];

const deadlineAlerts = [
  ["Jan 15", "Estimated tax payment due (Q4 prior year)"],
  ["Apr 15", "Federal individual filing and payment due date"],
  ["Jun 15", "Estimated tax payment due (Q2)"],
  ["Sep 15", "Estimated tax payment due (Q3)"],
];

const heroHeadlines = [
  "Taxes filed cleanly, quickly, and without confusion.",
  "From W-2 to FBAR, every step handled with clarity.",
  "NRI and business filings done right the first time.",
  "Expert-reviewed returns with zero guesswork.",
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img src={LOGO_SRC} alt="Tax Filey logo mark" className="h-11 w-11 object-contain" />
      <div className="leading-none">
        <div className="text-xl font-extrabold tracking-tight text-[var(--brand-deep)]">TaxFiley</div>
      </div>
    </div>
  );
}

function Button({
  children,
  variant = 'primary',
  className = '',
  onClick,
  type = 'button',
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'onDark';
  className?: string;
  onClick?: () => void;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
}) {
  const variantClasses = {
    primary: "bg-[var(--brand-deep)] text-white shadow-lg shadow-cyan-900/20 hover:-translate-y-0.5 hover:bg-[var(--brand-ocean)]",
    secondary: "border border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-[var(--brand-mint)] hover:text-[var(--brand-deep)]",
    onDark: "border border-white/70 bg-white/10 text-white hover:-translate-y-0.5 hover:border-white hover:bg-white/20",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all ${variantClasses[variant] ?? variantClasses.primary} ${className}`}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
      <Sparkles className="h-3.5 w-3.5" /> {children}
    </div>
  );
}

function Header({ active, setActive }: { active: string; setActive: (page: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <button onClick={() => setActive("Home")} className="text-left">
          <Logo />
        </button>
        <nav className="hidden items-center gap-1 lg:flex">
          {pages.map((page) => (
            <button key={page} onClick={() => setActive(page)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${active === page ? "bg-slate-100 text-[var(--brand-deep)]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
              {page}
            </button>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login">
            <Button variant="secondary">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>
              Start Filing <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} className="rounded-full border border-slate-200 p-3 lg:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
          <div className="grid gap-2">
            {pages.map((page) => (
              <button key={page} onClick={() => { setActive(page); setOpen(false); }} className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">
                {page}
              </button>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Login
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)} className="rounded-2xl bg-[var(--brand-deep)] px-4 py-3 text-center text-sm font-bold text-white">
              Start Filing
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero({ setActive }: { setActive: (page: string) => void }) {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const activeHeadline = heroHeadlines[headlineIndex];
  const typedHeadline = activeHeadline.slice(0, typedCount);
  const longestHeadline = useMemo(
    () => heroHeadlines.reduce((longest, current) => (current.length > longest.length ? current : longest), ""),
    [],
  );

  useEffect(() => {
    let timer;
    if (typedCount < activeHeadline.length) {
      timer = setTimeout(() => setTypedCount((prev) => prev + 1), 35);
    } else {
      timer = setTimeout(() => {
        setHeadlineIndex((prev) => (prev + 1) % heroHeadlines.length);
        setTypedCount(0);
      }, 1400);
    }
    return () => clearTimeout(timer);
  }, [typedCount, activeHeadline]);

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,var(--brand-soft),white_38%,#eef8f8_100%)]">
      <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[var(--brand-mint)]/20 blur-3xl" />
      <div className="absolute bottom-[-160px] left-[-100px] h-96 w-96 rounded-full bg-[var(--brand-deep)]/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"><ShieldCheck className="h-4 w-4 text-[var(--brand-ocean)]" /> U.S. tax filing for Indians, NRIs & businesses</div>
          <div className="relative max-w-4xl">
            <h1 className="invisible text-5xl font-black tracking-[-0.055em] md:text-7xl">{longestHeadline}</h1>
            <h1 className="absolute inset-0 z-20 text-5xl font-black tracking-[-0.055em] text-slate-950 md:text-7xl">
              {typedHeadline}
              <span className="ml-1 inline-block w-[0.08em] animate-pulse text-[var(--brand-deep)]">|</span>
            </h1>
          </div>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Tax Filey helps individuals and businesses handle U.S. tax filing, ITIN, FBAR, FATCA, bookkeeping, payroll, and tax planning through a simple online process.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup">
              <Button>Get free tax draft <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Button variant="secondary" onClick={() => setActive("Services")}>View services</Button>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
            {trustStats.map(([value, label]) => (
              <div key={value} className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="text-2xl font-black text-[var(--brand-deep)]">{value}</div>
                <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative">
          <div className="mb-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 p-4 shadow-sm">
            <img
              src={LOGO_SRC}
              alt="Tax Filey hero visual"
              className="h-48 w-full rounded-2xl object-contain bg-[linear-gradient(135deg,#ffffff_0%,#dff6ec_65%,#d8ecff_100%)] p-4 md:h-56"
            />
          </div>
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-indigo-950/10">
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
              <div className="flex items-center justify-between">
                <Logo />
                <div className="rounded-full bg-[var(--brand-mint)] px-3 py-1 text-xs font-black text-slate-950">LIVE</div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-white p-5 text-slate-950"><Clock3 className="h-6 w-6 text-[var(--brand-deep)]" /><div className="mt-4 text-2xl font-black">24h</div><div className="text-xs font-bold text-slate-500">draft turnaround</div></div>
                <div className="rounded-3xl bg-[var(--brand-mint)] p-5 text-slate-950"><ShieldCheck className="h-6 w-6" /><div className="mt-4 text-2xl font-black">Secure</div><div className="text-xs font-bold text-slate-700">document workflow</div></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-slate-200 bg-[linear-gradient(90deg,#d9f5e9_0%,#e9fbf3_45%,#d8f0ff_100%)] px-5 py-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        <span>IRS-ready documentation</span>
        <span>Encrypted document upload</span>
        <span>Expert-reviewed drafts</span>
        <span>Transparent pricing</span>
      </div>
    </section>
  );
}

function ServicesGrid() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#dff6ec_100%)] px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>Service offerings</SectionLabel>
          <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">Everything tax, kept simple.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">Clear service buckets for individuals, NRIs, founders, consultants, and small businesses.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title} className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/5">
                <div className="flex items-center justify-between">
                  <Icon className="h-11 w-11 rounded-2xl bg-slate-100 p-2.5 text-[var(--brand-deep)] group-hover:bg-[var(--brand-mint)] group-hover:text-slate-950" />
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">{service.tag}</span>
                </div>
                <h3 className="mt-6 text-xl font-black tracking-tight text-slate-950">{service.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{service.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Packages() {
  return (
    <section className="bg-[linear-gradient(180deg,#e9f4ff_0%,#d8ecff_100%)] px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionLabel>Popular packages</SectionLabel>
        <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">Choose a package, then customize.</h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {packages.map((pack) => (
            <div key={pack.name} className={`rounded-[2rem] border p-7 ${pack.featured ? "border-[var(--brand-deep)] bg-white shadow-xl shadow-cyan-900/10" : "border-slate-200 bg-white"}`}>
              {pack.featured && <div className="mb-5 inline-flex rounded-full bg-[var(--brand-deep)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">Most chosen</div>}
              <h3 className="text-2xl font-black text-slate-950">{pack.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">{pack.audience}</p>
              <div className="mt-5 text-4xl font-black text-[var(--brand-deep)]">{pack.price}<span className="text-base font-semibold text-slate-500"> / filing</span></div>
              <div className="mt-5 space-y-3">
                {pack.points.map((point) => (
                  <div key={point} className="flex items-start gap-2 text-sm font-semibold text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-ocean)]" /> {point}</div>
                ))}
              </div>
              <Link href="/signup" className="mt-6 block">
                <Button className="w-full">Choose {pack.name}</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CompareSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#dff6ed_100%)] px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionLabel>Why Tax Filey</SectionLabel>
        <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">Built for certainty, not guesswork.</h2>
        <div className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200">
          <div className="grid grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr] bg-slate-900 px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-white">
            <span>Feature</span><span>Tax Filey</span><span>H&R Block*</span><span>TurboTax*</span>
          </div>
          {compareRows.map((row, idx) => (
            <div key={row[0]} className={`grid grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr] px-6 py-4 text-sm ${idx % 2 ? "bg-slate-50" : "bg-white"}`}>
              <span className="font-bold text-slate-900">{row[0]}</span>
              <span className="font-semibold text-[var(--brand-deep)]">{row[1]}</span>
              <span className="text-slate-600">{row[2]}</span>
              <span className="text-slate-600">{row[3]}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">*General market positioning for guidance only. Exact offerings may vary by package and season.</p>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-[linear-gradient(180deg,#e8f3ff_0%,#d7ebff_100%)] px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionLabel>Client stories</SectionLabel>
        <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">People remember the clarity.</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <div key={item.name} className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <div className="mb-5 flex gap-1 text-amber-500">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
              <p className="leading-7 text-slate-700">"{item.quote}"</p>
              <div className="mt-6">
                <div className="font-black text-slate-900">{item.name}</div>
                <div className="text-sm font-semibold text-slate-500">{item.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudiencePanels({ setActive }: { setActive: (page: string) => void }) {
  return (
    <section className="bg-[linear-gradient(180deg,#dbf4e8_0%,#f0fbf6_100%)] px-5 py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        <div className="rounded-[2.25rem] bg-[var(--brand-deep)] p-8 text-white md:p-10">
          <UserRound className="h-12 w-12 rounded-2xl bg-white/10 p-3 text-[var(--brand-mint)]" />
          <h3 className="mt-8 text-3xl font-black tracking-[-0.035em]">For individuals & NRIs</h3>
          <p className="mt-4 leading-8 text-indigo-100">For people who need accurate filing without spending weeks understanding tax rules.</p>
          <div className="mt-7 grid gap-3">
            {individualServices.slice(0, 5).map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-white/10 p-3 text-sm font-semibold text-white"><CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--brand-mint)]" /> {item}</div>
            ))}
          </div>
          <Button variant="onDark" className="mt-8 w-full sm:w-auto" onClick={() => setActive("Individuals")}>
            Explore individual services
          </Button>
        </div>
        <div className="rounded-[2.25rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <Building2 className="h-12 w-12 rounded-2xl bg-[var(--brand-mint)]/20 p-3 text-[var(--brand-deep)]" />
          <h3 className="mt-8 text-3xl font-black tracking-[-0.035em] text-slate-950">For businesses</h3>
          <p className="mt-4 leading-8 text-slate-600">For founders and small businesses that need books, payroll, compliance, and tax returns handled together.</p>
          <div className="mt-7 grid gap-3">
            {businessServices.slice(0, 5).map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"><CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--brand-ocean)]" /> {item}</div>
            ))}
          </div>
          <Button className="mt-8" onClick={() => setActive("Businesses")}>Explore business services</Button>
        </div>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    ["01", "Sign up", "Create your account and tell us what kind of filing or tax support you need."],
    ["02", "Upload documents", "Share W-2s, 1099s, IDs, foreign account details, or business books securely."],
    ["03", "Get expert review", "A tax professional prepares your draft and flags missing information or opportunities."],
    ["04", "Approve & file", "Review the tax draft, approve the return, and file with confidence."],
  ];
  return (
    <section className="bg-[linear-gradient(180deg,#e8f3ff_0%,#d8ecff_100%)] px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionLabel>How it works</SectionLabel>
            <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">A clean online process from document to filing.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">Built for people who want clarity, speed, and human review without complicated tax worksheets.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map(([num, title, text]) => (
              <div key={num} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                <div className="text-sm font-black text-[var(--brand-ocean)]">{num}</div>
                <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TaxDeadlines() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#dcf5ea_100%)] px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 md:p-10">
        <SectionLabel>Tax calendar</SectionLabel>
        <h2 className="text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">Important U.S. tax deadlines at a glance.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {deadlineAlerts.map(([date, event]) => (
            <div key={date} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-lg font-black text-[var(--brand-deep)]">{date}</div>
              <div className="mt-2 text-sm font-semibold text-slate-600">{event}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#e8f3ff_0%,#d8ebff_100%)] px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionLabel>Frequently asked questions</SectionLabel>
        <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">Answers before you even ask.</h2>
        <div className="mt-10 grid gap-4">
          {faqs.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-slate-900">
                <span className="flex items-center gap-3"><CircleHelp className="h-5 w-5 text-[var(--brand-ocean)]" /> {item.q}</span>
                <ChevronRight className="h-4 w-4 text-slate-400 transition group-open:rotate-90" />
              </summary>
              <p className="mt-4 pl-8 leading-7 text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Resources() {
  const cards = [
    ["NRI tax checklist", "Download a ready-to-use doc checklist for first-time NRI filing."],
    ["Startup founder guide", "Understand payroll, quarterly taxes, and year-end filing basics."],
    ["IRS notice playbook", "See what to do in the first 48 hours after receiving a tax notice."],
  ];
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#def6ec_100%)] px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionLabel>Resource center</SectionLabel>
        <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">Learn once. File better every year.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map(([title, desc]) => (
            <div key={title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{desc}</p>
              <button className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[var(--brand-deep)]">Read guide <ArrowRight className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PageShell({
  label,
  title,
  text,
  children,
}: {
  label: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <main>
      <section className="bg-[radial-gradient(circle_at_top_right,var(--brand-soft),white_45%,#f4fbfa_100%)] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionLabel>{label}</SectionLabel>
          <h1 className="max-w-4xl text-5xl font-black tracking-[-0.055em] text-slate-950 md:text-7xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{text}</p>
        </div>
      </section>
      {children}
    </main>
  );
}

function ListPage({ kind }: { kind: string }) {
  const isIndividual = kind === "Individuals";
  const items = isIndividual ? individualServices : businessServices;
  return (
    <PageShell
      label={isIndividual ? "Individual tax services" : "Business tax services"}
      title={isIndividual ? "Personal tax filing made easier." : "Tax, books, and payroll for growing businesses."}
      text={isIndividual ? "For students, employees, NRIs, families, investors, and people with foreign reporting requirements." : "For LLCs, S-Corps, partnerships, consultants, founders, and small businesses that need reliable back-office support."}
    >
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#dcf5ea_100%)] px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[var(--brand-ocean)]" />
              <div>
                <h3 className="font-black text-slate-950">{item}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Handled with document review, expert guidance, and a clear next-step workflow.</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function Contact() {
  return (
    <PageShell label="Start filing" title="Get your tax work moving today." text="Share a few details and Tax Filey can guide you toward the right filing, advisory, or business support package.">
      <section className="bg-[linear-gradient(180deg,#e9f4ff_0%,#d8ecff_100%)] px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2.25rem] bg-slate-950 p-8 text-white md:p-10">
            <h2 className="text-3xl font-black tracking-[-0.035em]">What you can ask us about</h2>
            <div className="mt-8 space-y-4">
              {["Free tax draft", "ITIN and dependent filing", "FBAR / FATCA", "Business tax returns", "Bookkeeping and payroll", "IRS notice support"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-200"><ChevronRight className="h-5 w-5 text-[var(--brand-mint)]" /> {item}</div>
              ))}
            </div>
          </div>
          <form className="rounded-[2.25rem] border border-slate-200 bg-slate-50 p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <input placeholder="Full name" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-[var(--brand-mint)]" />
              <input placeholder="Email" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-[var(--brand-mint)]" />
              <input placeholder="Phone" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-[var(--brand-mint)]" />
              <select className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-[var(--brand-mint)]">
                <option>Individual filing</option>
                <option>Business filing</option>
                <option>ITIN support</option>
                <option>FBAR / FATCA</option>
                <option>Bookkeeping / Payroll</option>
              </select>
              <textarea placeholder="Tell us what you need help with" className="min-h-36 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-[var(--brand-mint)] md:col-span-2" />
            </div>
            <Link href="/signup" className="mt-5 block">
              <Button className="w-full">Create account <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </form>
        </div>
      </section>
    </PageShell>
  );
}

function CTA() {
  return (
    <section className="bg-slate-950 px-5 py-16 text-white lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-4xl font-black tracking-[-0.04em]">Ready to file without stress?</h2>
          <p className="mt-3 max-w-2xl text-slate-300">Start with a simple intake. Tax Filey will guide the documents, review, and filing steps.</p>
        </div>
        <Link href="/signup">
          <Button className="bg-[var(--brand-mint)] text-slate-950 hover:bg-[var(--brand-mint-strong)]">
            Get started <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

function Footer({ setActive }: { setActive: (page: string) => void }) {
  return (
    <footer className="bg-white px-5 py-12 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 border-t border-slate-200 pt-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-md leading-7 text-slate-600">Online tax filing and tax advisory support for individuals, NRIs, and businesses.</p>
        </div>
        <div>
          <h4 className="font-black text-slate-950">Company</h4>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-600">
            {pages.slice(0, 5).map((page) => (
              <button key={page} onClick={() => setActive(page)} className="text-left hover:text-[var(--brand-deep)]">{page}</button>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-black text-slate-950">Services</h4>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-600">
            <span>Tax filing</span><span>ITIN</span><span>FBAR / FATCA</span><span>Bookkeeping</span><span>Payroll</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Home({ setActive }: { setActive: (page: string) => void }) {
  return (
    <main>
      <Hero setActive={setActive} />
      <TrustStrip />
      <ServicesGrid />
      <Packages />
      <CompareSection />
      <AudiencePanels setActive={setActive} />
      <Process />
      <TaxDeadlines />
      <Testimonials />
      <FAQSection />
      <Resources />
    </main>
  );
}

export function LandingPage() {
  const [active, setActive] = useState('Home');
  const content = useMemo(() => {
    if (active === "Home") return <Home setActive={setActive} />;
    if (active === "Services") {
      return (
        <PageShell label="Services" title="Clear tax support for every filing need." text="Tax Filey combines individual filing, foreign reporting, advisory, business tax, bookkeeping, and payroll into a simple service menu.">
          <ServicesGrid />
          <Packages />
          <CompareSection />
          <Process />
          <FAQSection />
        </PageShell>
      );
    }
    if (active === "Individuals") return <ListPage kind="Individuals" />;
    if (active === "Businesses") return <ListPage kind="Businesses" />;
    if (active === "Process") {
      return (
        <PageShell label="Process" title="Simple steps. Expert review. Clean filing." text="A guided online workflow built to remove back-and-forth and make tax filing feel predictable.">
          <Process />
          <TaxDeadlines />
        </PageShell>
      );
    }
    if (active === "Contact") return <Contact />;
    return <Home setActive={setActive} />;
  }, [active]);

  return (
    <motion.div className="marketing-site min-h-screen bg-white text-slate-950">
      <Header active={active} setActive={setActive} />
      {content}
      <CTA />
      <Footer setActive={setActive} />
    </motion.div>
  );
}
