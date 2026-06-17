import React, { useState, useEffect } from "react";
import { Music, Volume2, Waves, Mic, Play, ShieldAlert, Award, Flame, Dumbbell } from "lucide-react";

export default function GymSoundboard() {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [announcerText, setAnnouncerText] = useState("");
  const [selectedScript, setSelectedScript] = useState("pr-shat");
  const [customLifter, setCustomLifter] = useState("Zunair Kalyar");
  const [customExercise, setCustomExercise] = useState("Olympic Bench Press");
  const [customWeight, setCustomWeight] = useState("130");

  const [meterHeights, setMeterHeights] = useState([12, 8, 4, 16, 22, 6, 11, 5, 18, 9]);

  // Handle fake graphic equalizer movement when playing audio
  useEffect(() => {
    let interval: number | null = null;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setMeterHeights(Array.from({ length: 12 }, () => Math.floor(4 + Math.random() * 32)));
      }, 120);
    } else {
      setMeterHeights([8, 12, 10, 6, 8, 12, 14, 8, 10, 6, 12, 8]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Audio Context synthesis
  const createAudioContext = () => {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  };

  const stopActiveIndicator = (id: string, delay: number) => {
    setIsPlaying(id);
    setTimeout(() => {
      setIsPlaying(null);
    }, delay * 1000);
  };

  const playHeavyBell = () => {
    try {
      const ctx = createAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(329.63, ctx.currentTime); // E4 fundamental
      osc1.frequency.exponentialRampToValueAtTime(110.00, ctx.currentTime + 1.5);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(164.81, ctx.currentTime); // oct low
      osc2.frequency.exponentialRampToValueAtTime(55.00, ctx.currentTime + 1.5);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 2.1);
      osc2.stop(ctx.currentTime + 2.1);

      stopActiveIndicator("heavy-bell", 2.1);
    } catch (e) {
      console.error(e);
    }
  };

  const playSynthAlarm = () => {
    try {
      const ctx = createAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      
      // Up and down chirp sirens
      for (let i = 0; i < 4; i++) {
        const step = i * 0.35;
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + step + 0.18);
        osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + step + 0.35);
      }

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.5);

      stopActiveIndicator("synth-alarm", 1.5);
    } catch (e) {
      console.error(e);
    }
  };

  const playBuzzer = () => {
    try {
      const ctx = createAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(130.81, ctx.currentTime); // Low buzz

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.setValueAtTime(0.01, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.7);

      stopActiveIndicator("buzzer", 0.7);
    } catch (e) {
      console.error(e);
    }
  };

  const playSlam = () => {
    try {
      const ctx = createAudioContext();
      
      // Noise source for sand/friction
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(120, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.8);

      stopActiveIndicator("slam", 0.8);
    } catch (e) {
      console.error(e);
    }
  };

  // Text-To-Speech dynamic announcers
  const fireGymAnnouncer = () => {
    if (!("speechSynthesis" in window)) {
      alert("❌ Text-To-Speech is not supported by this browser shell.");
      return;
    }

    window.speechSynthesis.cancel(); // kill any queued voices

    let textToSay = "";
    const nameUpper = customLifter.trim().toUpperCase();
    const exUpper = customExercise.trim();
    const weightVal = parseFloat(customWeight) || 100;

    switch (selectedScript) {
      case "pr-shat":
        textToSay = `Attention Athletes! All stars focus in! ${nameUpper} has just annihilated the verified standings! A clean personal record on ${exUpper} clocking an outstanding ${weightVal} kilograms! Let's salute the mental grit! Absolout beast mode!`;
        break;
      case "rack-dumbbells":
        textToSay = `Correction bulletin for all ground members! Please re rack your plates and dumbbells immediately after your lift sets. Keep the Life Fitness floor immaculate for your fellow lifters. Thank you very much!`;
        break;
      case "nutrition-protocol":
        textToSay = `Gains notice! Fueling windows are critical. Consume complex glycogen carbohydrates before your lift sets, and drink protein whey isolate thirty minutes post workout to secure cell hydration and muscle repair!`;
        break;
      case "time-female":
        textToSay = `Notice: Ladies only split hours are commencing. All male lifters, please vacate the floor space cordially in the next five minutes. Thank you for your discipline!`;
        break;
      default:
        textToSay = announcerText.trim();
        break;
    }

    if (!textToSay) {
      textToSay = "Life Fitness Arena is live. Welcome ground level champions to another intensive sweat session. Stay hydarted, keep spotting!";
    }

    const utterance = new SpeechSynthesisUtterance(textToSay);
    
    // Attempt to select an elegant deep English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishMaleVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Male") || v.name.includes("Google") || v.name.includes("Daniel")));
    if (englishMaleVoice) {
      utterance.voice = englishMaleVoice;
    }

    utterance.volume = 1.0;
    utterance.rate = 1.05; // slightly faster announcer flow
    utterance.pitch = 0.95; // slightly deeper base

    utterance.onstart = () => {
      setIsPlaying("announcer");
    };

    utterance.onend = () => {
      setIsPlaying(null);
    };

    utterance.onerror = () => {
      setIsPlaying(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6" id="gym-soundboard-widget">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-850 pb-4">
        <div>
          <span className="text-red-500 text-[10px] uppercase font-black tracking-widest font-mono flex items-center gap-1">
            <Volume2 className="h-3.5 w-3.5 animate-pulse text-red-500" /> Ground Floor DJ Control Panel
          </span>
          <h3 className="text-white text-base font-black uppercase tracking-tight mt-0.5">Atmospheric Gym DJ & Synthesizer</h3>
        </div>
        
        {/* Equalizer Wave visuals */}
        <div className="flex items-end gap-1 px-3 py-1.5 bg-neutral-950 border border-neutral-850 rounded-2xl h-10 select-none">
          {meterHeights.map((h, i) => (
            <div 
              key={i} 
              className={`w-1 rounded-t transition-all ${isPlaying ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-neutral-800"}`}
              style={{ height: `${h}px` }} 
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* SYNTH SOUNDBOARD PANEL: LEFT COLUMN */}
        <div className="md:col-span-5 space-y-4">
          <span className="text-[9px] text-neutral-500 uppercase font-black tracking-wider block font-mono">Analog Synthesizer Chords</span>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={playHeavyBell}
              className={`p-4 bg-neutral-950 hover:bg-neutral-950/85 border rounded-2xl flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer ${
                isPlaying === "heavy-bell" ? "border-red-500 text-red-500 animate-pulse bg-red-600/5" : "border-neutral-850 text-neutral-400 hover:border-neutral-700 hover:text-white"
              }`}
            >
              <Music className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-black uppercase block leading-tight">Arena Bell</span>
                <span className="text-[8px] text-neutral-500 block mt-0.5 font-bold uppercase tracking-widest font-mono leading-none">Chime chord</span>
              </div>
            </button>

            <button
              onClick={playSynthAlarm}
              className={`p-4 bg-neutral-950 hover:bg-neutral-950/85 border rounded-2xl flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer ${
                isPlaying === "synth-alarm" ? "border-red-500 text-red-500 animate-pulse bg-red-600/5" : "border-neutral-850 text-neutral-400 hover:border-neutral-700 hover:text-white"
              }`}
            >
              <Waves className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-black uppercase block leading-tight">Chirp Siren</span>
                <span className="text-[8px] text-neutral-500 block mt-0.5 font-bold uppercase tracking-widest font-mono leading-none">Alarm Sweep</span>
              </div>
            </button>

            <button
              onClick={playBuzzer}
              className={`p-4 bg-neutral-950 hover:bg-neutral-950/85 border rounded-2xl flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer ${
                isPlaying === "buzzer" ? "border-red-500 text-red-500 animate-pulse bg-red-600/5" : "border-neutral-850 text-neutral-400 hover:border-neutral-700 hover:text-white"
              }`}
            >
              <ShieldAlert className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-black uppercase block leading-tight">Split Buzzer</span>
                <span className="text-[8px] text-neutral-500 block mt-0.5 font-bold uppercase tracking-widest font-mono leading-none">Dual squares</span>
              </div>
            </button>

            <button
              onClick={playSlam}
              className={`p-4 bg-neutral-950 hover:bg-neutral-950/85 border rounded-2xl flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer ${
                isPlaying === "slam" ? "border-red-500 text-red-500 animate-pulse bg-red-600/5" : "border-neutral-850 text-neutral-400 hover:border-neutral-700 hover:text-white"
              }`}
            >
              <Dumbbell className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-black uppercase block leading-tight">Weight Drop</span>
                <span className="text-[8px] text-neutral-500 block mt-0.5 font-bold uppercase tracking-widest font-mono leading-none">White Noise Slam</span>
              </div>
            </button>
          </div>
        </div>

        {/* TTS SPEAKER CONTROLS PANEL: RIGHT COLUMN */}
        <div className="md:col-span-7 bg-neutral-950 p-5 rounded-3xl border border-neutral-850 space-y-4">
          <span className="text-[9px] text-neutral-500 uppercase font-black tracking-wider block font-mono">Dynamic Text-To-Speech Vocoder</span>

          {/* Script selectors */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-wider">
              {[
                { id: "pr-shat", label: "🏆 NEW RECORD PR" },
                { id: "rack-dumbbells", label: "📋 RACKS DECENCY" },
                { id: "nutrition-protocol", label: "🥗 DIET PROTOCOL" },
                { id: "time-female", label: "♀️ WOMEN HOUR" }
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setSelectedScript(sc.id)}
                  className={`py-2 px-1 text-center rounded-xl border text-[9px] cursor-pointer transition-all truncate leading-none ${
                    selectedScript === sc.id
                      ? "bg-red-500/10 border-red-500 text-red-500"
                      : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white"
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            {/* Custom fields - conditional */}
            {selectedScript === "pr-shat" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px] font-bold">
                <div className="space-y-1">
                  <span className="text-[8px] text-neutral-500 uppercase font-black font-mono">Lifter Name</span>
                  <input
                    type="text"
                    value={customLifter}
                    onChange={(e) => setCustomLifter(e.target.value)}
                    placeholder="E.g. Ali"
                    className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-neutral-500 uppercase font-black font-mono">Compound Exercise</span>
                  <input
                    type="text"
                    value={customExercise}
                    onChange={(e) => setCustomExercise(e.target.value)}
                    placeholder="E.g. Bench Press"
                    className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-neutral-500 uppercase font-black font-mono">Weight (kg)</span>
                  <input
                    type="number"
                    value={customWeight}
                    onChange={(e) => setCustomWeight(e.target.value)}
                    placeholder="E.g. 140"
                    className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Script description */}
            <div className="bg-neutral-900 p-3 rounded-2xl border border-neutral-850/60 font-semibold text-[10px] leading-relaxed text-neutral-300">
              <span className="text-white font-extrabold block uppercase tracking-wider text-[8px] font-mono mb-1">Speaker Preview Script Lines:</span>
              <p>
                {selectedScript === "pr-shat" && `[ANNOUNCEMENT SOUND] Attention Athletes! All stars focus in! ${customLifter.toUpperCase()} has just annihilated the verified standings! A clean personal record on ${customExercise} clocking an outstanding ${customWeight || "100"} kilograms!`}
                {selectedScript === "rack-dumbbells" && `[ANNOUNCEMENT SOUND] Correction bulletin for all ground members! Please re rack your plates and dumbbells immediately after your lift sets.`}
                {selectedScript === "nutrition-protocol" && `[ANNOUNCEMENT SOUND] Gains notice! Fueling windows are critical. Consume complex glycogen carbohydrates before your lift sets.`}
                {selectedScript === "time-female" && `[ANNOUNCEMENT SOUND] Notice: Ladies only split hours are commencing. All male lifters, please vacate the floor space cordially.`}
              </p>
            </div>
          </div>

          <button
            onClick={fireGymAnnouncer}
            disabled={isPlaying === "announcer"}
            className={`w-full py-2.5 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
              isPlaying === "announcer"
                ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 border-red-400 hover:border-red-500 text-white shadow-lg shadow-red-550/15 active:scale-95"
            }`}
          >
            <Mic className="h-4 w-4" />
            {isPlaying === "announcer" ? "Broadcasting speaker feed..." : "Broadcast Speaker Announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}
