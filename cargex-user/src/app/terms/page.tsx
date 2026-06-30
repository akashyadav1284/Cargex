"use client";

import Link from 'next/link';
import { ArrowLeft, FileText, Phone, Mail } from 'lucide-react';

export default function TermsPage() {
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
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-black">Terms & Conditions</h1>
              <p className="text-xs text-gray-500 font-semibold mt-1 uppercase tracking-wide">Last Updated: June 30, 2026</p>
            </div>
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Welcome to Cargex. Please read these Terms and Conditions carefully before using our logistics matchmaking web portals and mobile applications. By accessing or using our services, you agree to be bound by these terms.
          </p>

          <hr className="border-gray-200 my-8" />

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">1. Account Registration & Credentials</h2>
            <p className="text-gray-600 leading-relaxed">
              Users must create an account using valid personal details to book transport matches. You agree to safeguard your credentials and take full ownership of all booking and payout actions authorized under your registered profile.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">2. Matchmaking Technology</h2>
            <p className="text-gray-600 leading-relaxed">
              Cargex operates strictly as a tech platform that connects cargo shippers with independent, third-party logistics partners and vehicle drivers. Cargex does not own, lease, or operate commercial cargo trucks, and is not a common carrier.
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">3. Carriage Restrictions & Cargo Integrity</h2>
            <p className="text-gray-600 leading-relaxed">
              Shippers must guarantee that all cargo items comply with applicable laws. You shall not request transport for hazardous waste, explosive chemicals, flammable liquids, contraband, or any items banned by governmental transit regulations.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">4. Dynamic Pricing, Surge & Payments</h2>
            <p className="text-gray-600 leading-relaxed">
              Estimated transport fares are generated dynamically based on routing distances, vehicle type parameters, categories, and helpers. All bookings must be paid upfront using Cash, UPI, or Wallet.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">5. Verification OTPs & Transit Liabilities</h2>
            <p className="text-gray-600 leading-relaxed">
              To safeguard freight transport, users must verify dispatches using the Pickup and Drop OTP verification system. Cargex bears no liability for damaged goods, vehicle delays, or carrier service failures. Primary carriage liability resides with the independent transporter.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">6. Cancellations & Dry-Run Compensation</h2>
            <p className="text-gray-600 leading-relaxed">
              Requests cancelled after a driver arrives at a pickup address are subject to a dry-run compensation fee to cover fuel and time expenses incurred by the transport partner.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-3">7. Dispute Resolution & Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These service terms are governed by the laws of India. Any legal actions or litigation arising from this contract shall be submitted to the exclusive jurisdiction of the courts of New Delhi, India.
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
