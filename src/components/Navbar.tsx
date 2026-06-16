import React, { useState } from "react";
import { Menu, X, Trophy, User, ShieldAlert, Dumbbell } from "lucide-react";
import { UserRole } from "../types";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: { email: string | null; role: UserRole; uid: string } | null;
  onLogout: () => void;
  gymName: string;
}

export default function Navbar({ currentView, onNavigate, currentUser, onLogout, gymName }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const publicLinks = [
    { name: "Home", view: "home" },
    { name: "Membership", view: "membership" },
    { name: "Timings", view: "timings" },
    { name: "Challenges", view: "challenges" },
    { name: "Contact", view: "contact" }
  ];

  const resolvedGymName = gymName || "Life Fitness";

  return (
    <nav className="sticky top-0 z-50 bg-neutral-950/95 border-b border-neutral-900 backdrop-blur-md">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and Name */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => { onNavigate("home"); setIsOpen(false); }}>
            <div className="bg-red-650 p-1.5 sm:p-2 rounded-lg flex items-center justify-center text-black shadow-lg shadow-yellow-500/10">
              <Dumbbell className="h-5 sm:h-6 w-5 sm:w-6" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-xl tracking-wider text-white flex items-center gap-1 uppercase leading-none">
                {resolvedGymName}
              </span>
              <span className="text-[9px] sm:text-[10px] text-red-500 font-bold uppercase tracking-widest block mt-0.5 sm:mt-0">
                Premium Gym
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {publicLinks.map((link) => {
              const isActive = currentView === link.view;
              return (
                <button
                  key={link.view}
                  id={`nav-${link.view}`}
                  onClick={() => onNavigate(link.view)}
                  className={`px-3 py-2 rounded-md text-sm font-semibold tracking-wide transition-all ${
                    isActive
                      ? "text-red-500 bg-neutral-900"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
                  }`}
                >
                  {link.name}
                </button>
              );
            })}
          </div>

          {/* User & Action Buttons (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              id="nav-tv"
              onClick={() => onNavigate("tv")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all"
            >
              <Trophy className="h-3.5 w-3.5" />
              TV Live
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3 border-l border-neutral-800 pl-3">
                <button
                  onClick={() => {
                    if (currentUser.role === "member") {
                      onNavigate("member-portal");
                    } else {
                      onNavigate("admin");
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase px-3.5 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 transition-all"
                >
                  <User className="h-4 w-4 text-red-500" />
                  {currentUser.role === "member" ? "My Portal" : "Admin Panel"}
                </button>
                <button
                  onClick={onLogout}
                  className="text-xs font-bold text-neutral-500 hover:text-white hover:underline transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-3">
                <button
                  id="nav-login"
                  onClick={() => onNavigate("login")}
                  className="text-sm font-bold text-neutral-400 hover:text-white transition-all px-2.5 py-2"
                >
                  Member Login
                </button>
                <button
                  id="nav-join"
                  onClick={() => onNavigate("join")}
                  className="bg-red-650 hover:bg-red-700 text-black font-black text-sm px-5 py-2.5 rounded-lg uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  Join Now
                </button>
              </div>
            )}
          </div>

          {/* Mobile header (Join button + Hamburger Menu) */}
          <div className="lg:hidden flex items-center gap-2">
            {!currentUser && (
              <button
                onClick={() => onNavigate("join")}
                className="bg-red-650 hover:bg-red-700 text-black text-[10px] sm:text-xs font-black uppercase px-3 py-1.5 rounded-md tracking-wider transition-all"
              >
                Join Now
              </button>
            )}
            <button
              id="nav-tv-mobile"
              onClick={() => onNavigate("tv")}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 uppercase"
            >
              TV
            </button>
            <button
              id="mobile-menu-btn"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 sm:p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 focus:outline-none"
            >
              {isOpen ? <X className="h-5 sm:h-6 w-5 sm:h-6" /> : <Menu className="h-5 sm:h-6 w-5 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="lg:hidden border-t border-neutral-900 bg-neutral-950 px-4 pt-2 pb-6 space-y-1">
          {publicLinks.map((link) => {
            const isActive = currentView === link.view;
            return (
              <button
                key={link.view}
                onClick={() => {
                  onNavigate(link.view);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-md text-sm sm:text-base font-bold transition-all ${
                  isActive
                    ? "text-red-500 bg-neutral-900"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
                }`}
              >
                {link.name}
              </button>
            );
          })}
          <div className="pt-3 border-t border-neutral-900 space-y-2">
            {currentUser ? (
              <div className="space-y-2 px-4">
                <p className="text-xs text-neutral-500 truncate">{currentUser.email}</p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate(currentUser.role === "member" ? "member-portal" : "admin");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-650 text-black font-black uppercase tracking-wide rounded-lg text-xs"
                >
                  <User className="h-4 w-4" />
                  {currentUser.role === "member" ? "Member Portal" : "Admin Dashboard"}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="w-full text-center py-2 text-xs font-bold text-neutral-400 hover:text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate("login");
                  }}
                  className="w-full text-center py-2.5 rounded-lg border border-neutral-800 text-xs font-bold text-neutral-300"
                >
                  Member Login
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate("join");
                  }}
                  className="w-full text-center py-2.5 rounded-lg bg-red-650 text-black text-xs font-black uppercase tracking-wider"
                >
                  Join Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
