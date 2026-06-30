"use client";

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Phone, Mail } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans pb-16">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-black">
            Cargex<span className="text-[#10B981] font-black">.</span>
          </Link>
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 mt-12">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#10B981]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-black">Privacy Policy</h1>
              <p className="text-xs text-gray-500 font-semibold mt-1 uppercase tracking-wide">Last Updated: June 30, 2026</p>
            </div>
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            At Cargex, protecting your privacy is our primary concern. This policy details what data we collect, how it is handled, and your privacy control rights. By using our website or mobile apps, you consent to our data collection procedures.
          </p>

          <hr className="border-gray-200 my-8" />

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">1. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed">
              We collect information you submit directly, such as your Full Name, Email, and Phone Number. We also track precise real-time location metrics (lat/lon coordinates) of your pickup/drop points and vehicle dispatch tracking to facilitate secure cargo routing.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed">
              The coordinates and contacts gathered are used to calculate distance metrics, recommend vehicles, pair you with driver partners, broadcast WebSocket location pins, and verify dispatch handshakes using secure OTPs.
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">3. Shared Data With Drivers</h2>
            <p className="text-gray-600 leading-relaxed">
              To execute deliveries successfully, your pickup addresses, drop addresses, cargo weights, passenger names, and phone numbers are shared with the matching transport driver who accepts your dispatch.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">4. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              All communications between your devices and our backend APIs are encrypted using industry-standard SSL certificates. Password databases are hashed, and authorization sessions are authenticated using secure JSON Web Tokens.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">5. Location Services & Permissions</h2>
            <p className="text-gray-600 leading-relaxed">
              Our mobile apps request GPS location permissions to make pickup geocoding easier. You can choose to deny this permission, but you will need to enter coordinates manually.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">6. Access & Account Deletion Rights</h2>
            <p className="text-gray-600 leading-relaxed">
              You have full rights to request correction or complete removal of your personal profile data from our databases. To delete your account data, please get in touch with our helpdesk team.
            </p>
          </section>

          <hr className="border-gray-200 my-8" />

          {/* Footer Contact Callout */}
          <div className="bg-[#F9FAFB] rounded-xl p-6 border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-black text-sm">Need help or clarification?</h3>
              <p className="text-xs text-gray-500 mt-1">Our support helpline is available 24/7 for you.</p>
            </div>
            <div className="flex gap-4">
              <a href="tel:+919467658854" className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-black transition-colors">
                <Phone size={14} className="text-[#10B981]" />
                Call Helpline
              </a>
              <a href="mailto:akashyadav9992462520@gmail.com" className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-black transition-colors">
                <Mail size={14} className="text-[#10B981]" />
                Support Email
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
