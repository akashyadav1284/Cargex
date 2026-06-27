"use client";

import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Mail, Phone, ArrowUp } from 'lucide-react';
import { FaInstagram, FaXTwitter, FaLinkedin, FaYoutube } from 'react-icons/fa6';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight"><span className="text-primary font-black">Cargex</span></Link>
          <div className="flex items-center gap-4">
            <SignedOut>
              <Link href="/login" className="text-sm font-medium hover:bg-surface py-2 px-4 rounded-full transition-colors">Log in</Link>
              <Link href="/register" className="bg-primary text-white text-sm font-medium py-2 px-4 rounded-full hover:bg-[#333] transition-colors shadow-sm">Sign up</Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="bg-primary text-white text-sm font-medium py-2 px-4 rounded-full hover:bg-[#333] transition-colors shadow-sm">Dashboard</Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      <section className="bg-background pt-16 pb-24 md:pt-32 md:pb-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="z-10 mt-10 lg:mt-0">
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-8">Go anywhere with Cargex</h1>
            <p className="text-lg text-muted mb-10 max-w-lg leading-relaxed">Request a ride, hop in, and go. Transparent pricing and reliable cargo matching at your fingertips.</p>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-4 rounded-xl shadow-lg shadow-black/10">Take Ride</Link>
              <SignedOut>
                <Link href="/login" className="btn-secondary text-lg px-8 py-4 rounded-xl">Log in</Link>
              </SignedOut>
            </div>
          </div>
          <div className="relative h-[500px] lg:h-[600px] w-full hidden lg:block overflow-hidden rounded-2xl">
            <Image src="/images/hero.png" alt="Cargex logistics" fill className="object-cover" priority />
          </div>
        </div>
      </section>

      <section className="py-24 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 tracking-tight">Focused on safety, wherever you go</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { img: '/images/tracking.png', title: 'Real-time tracking', desc: 'Watch your cargo move in real time. Share live trip links with your customers.' },
              { img: '/images/pricing.png', title: 'Transparent pricing', desc: 'No hidden fees. Get dynamic, upfront fare breakdowns before you book.' },
              { img: '/images/drivers.png', title: 'Verified drivers', desc: 'Every vehicle and driver is meticulously vetted by our compliance systems.' },
            ].map((f, i) => (
              <div key={i} className="group">
                <div className="w-full aspect-[4/3] bg-white rounded-xl mb-6 overflow-hidden shadow-sm border border-border group-hover:shadow-md transition-shadow">
                  <Image src={f.img} alt={f.title} width={400} height={300} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#0a0a0a] text-gray-300 pt-20 pb-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

            {/* Column 1: Branding */}
            <div className="lg:col-span-1">
              <Link href="/" className="text-3xl font-black tracking-tight text-white mb-6 block">Cargex.</Link>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Cargex is a smart logistics platform that connects users with verified drivers for fast, secure, and reliable cargo delivery.
              </p>
            </div>

            {/* Column 2: Contact Info */}
            <div>
              <h4 className="font-bold text-white mb-6 text-lg tracking-wide">Contact Us</h4>
              <ul className="space-y-4">
                <li>
                  <a href="mailto:akashyadav9992462520@gmail.com" className="group flex items-center gap-3 hover:text-white transition-colors duration-300 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      <Mail size={16} />
                    </div>
                    akashyadav9992462520@gmail.com
                  </a>
                </li>
                <li>
                  <a href="tel:+919467658854" className="group flex items-center gap-3 hover:text-white transition-colors duration-300 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      <Phone size={16} />
                    </div>
                    +91 9467658854
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Social Media */}
            <div>
              <h4 className="font-bold text-white mb-6 text-lg tracking-wide">Follow Us</h4>
              <div className="flex gap-4">
                {[
                  { Icon: FaInstagram, href: '#' },
                  { Icon: FaXTwitter, href: '#' },
                  { Icon: FaLinkedin, href: '#' },
                  { Icon: FaYoutube, href: '#' }
                ].map((social, idx) => (
                  <a key={idx} href={social.href} className="w-10 h-10 rounded-full border border-gray-800 bg-gray-900/50 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black hover:-translate-y-1 hover:border-white transition-all duration-300 shadow-sm">
                    <social.Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 4: Legal & Back to Top */}
            <div>
              <h4 className="font-bold text-white mb-6 text-lg tracking-wide">Legal</h4>
              <ul className="space-y-3 mb-8">
                <li>
                  <Link href="/terms" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">
                    Privacy Policy
                  </Link>
                </li>
              </ul>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="group flex items-center gap-2 text-sm font-semibold text-white hover:text-primary transition-colors duration-300"
              >
                Back to Top
                <ArrowUp size={16} className="group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>© 2026 Cargex Technologies Inc. All rights reserved.</p>
            <p className="mt-4 md:mt-0 italic font-semibold text-gray-400 text-center">
              "Need assistance? Our instant helpline is here to support you 24/7." — Call <span className="text-white font-bold">+91 9467658854</span>
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <span className="hover:text-gray-300 cursor-pointer transition-colors">Designed for modern logistics</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
