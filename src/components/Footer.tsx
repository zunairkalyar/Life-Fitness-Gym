import React from "react";
import { Phone, MapPin, ShieldAlert, Heart, Calendar } from "lucide-react";

interface FooterProps {
  onNavigate: (view: string) => void;
  gymName: string;
  address: string;
  phone: string;
  whatsApp: string;
}

export default function Footer({ onNavigate, gymName, address, phone, whatsApp }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const resolvedGymName = gymName || "Life Fitness";

  return (
    <footer className="bg-neutral-950 border-t border-neutral-900 text-neutral-400">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Gym Overview */}
          <div className="space-y-4">
            <span className="font-black text-2xl tracking-wider text-white uppercase block">
              {resolvedGymName}
            </span>
            <p className="text-sm leading-relaxed text-neutral-400">
              Mandi Bahauddin's premier strength training center. We run 9 monthly community challenges 
              to award free membership extensions, driving our members towards functional progression 
              and disciplined fitness safely.
            </p>
          </div>

          {/* Quick Explore Links */}
          <div className="space-y-4">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-widest border-l-2 border-red-500 pl-2">
              Explore
            </h4>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li>
                <button onClick={() => onNavigate("home")} className="hover:text-white transition-all text-left text-neutral-400">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("membership")} className="hover:text-white transition-all text-left text-neutral-400">
                  Membership
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("timings")} className="hover:text-white transition-all text-left text-neutral-400">
                  Timings
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("challenges")} className="hover:text-white transition-all text-left text-neutral-400">
                  Challenges
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("facilities")} className="hover:text-white transition-all text-left text-neutral-400">
                  Facilities
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("gallery")} className="hover:text-white transition-all text-left text-neutral-400">
                  Gallery
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("contact")} className="hover:text-white transition-all text-left text-neutral-400">
                  Contact
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("tv")} className="hover:text-white transition-all text-left text-neutral-400 font-bold text-yellow-500">
                  TV Live
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-widest border-l-2 border-red-500 pl-2">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span className="text-neutral-300">
                  {address || "Life Fitness Building, Wasar Road, Mandi Bahauddin, Pakistan"}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-red-500 shrink-0" />
                <a href={`tel:${phone || "+923443292360"}`} className="text-neutral-300 hover:text-white transition-all underline">
                  {phone || "0344 3292360"}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-red-500 font-bold text-xs shrink-0 bg-red-600/10 px-1 py-0.5 rounded uppercase font-mono">
                  WA
                </span>
                <a 
                  href={`https://wa.me/${(whatsApp || "923443292360").replace(/[^0-9]/g, "")}`} 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="text-neutral-300 hover:text-white transition-all underline"
                >
                  WhatsApp Admin
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Matters */}
          <div className="space-y-4">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-widest border-l-2 border-red-500 pl-2">
              Legal & Help
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onNavigate("privacy")} className="hover:text-white hover:underline text-left text-neutral-400">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("terms")} className="hover:text-white hover:underline text-left text-neutral-400">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("faq")} className="hover:text-white hover:underline text-left text-neutral-400">
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Supervision Rule */}
        <div className="mt-8 bg-red-950/20 border border-red-900/30 rounded-xl p-4 flex gap-3">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-200/90 leading-relaxed font-semibold">
            <span className="uppercase tracking-widest text-[9px] block text-red-500 font-extrabold mb-1">
              Safety Warning & Supervision Rules
            </span>
            All strength and endurance attempts must be performed under staff supervision. Members should 
            never lift weights without an authorized trainer spotting, or attempt weights beyond safe capacity.
          </p>
        </div>

        {/* Bottom copyright declaration */}
        <div className="mt-12 pt-8 border-t border-neutral-900 text-center text-xs text-neutral-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {currentYear} {resolvedGymName}. All rights reserved.</p>
          <div className="flex items-center gap-1.5 justify-center">
            <span>Powering Community Strength</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
            <span>in Mandi Bahauddin</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
