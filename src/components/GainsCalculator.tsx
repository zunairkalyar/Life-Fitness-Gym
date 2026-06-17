import React, { useState } from "react";
import { Scale, Flame, Activity, Brain, Check, RefreshCw, Clipboard } from "lucide-react";

interface GainsCalculatorProps {
  onApplyTargets: (calories: number, protein: number, carbs: number, fats: number) => void;
  currentCalories: number;
}

export default function GainsCalculator({ onApplyTargets, currentCalories }: GainsCalculatorProps) {
  // Biological metrics state
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [weight, setWeight] = useState(75); // kg
  const [height, setHeight] = useState(175); // cm
  const [age, setAge] = useState(25); // years
  const [activityLevel, setActivityLevel] = useState<number>(1.55); // 1.2: sedentary, 1.375: light, 1.55: moderate, 1.725: active, 1.9: heavy athlete
  const [fitnessGoal, setFitnessGoal] = useState<"extreme-shred" | "clean-bulk" | "body-recomp" | "maintenance">("body-recomp");

  // Calculated variables
  // Miflin-St Jeor Formula
  const bmr = Math.round(
    gender === "Male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161
  );

  const tdee = Math.round(bmr * activityLevel);

  // Target Calorie determination
  let targetCalories = tdee;
  if (fitnessGoal === "extreme-shred") targetCalories = Math.max(1200, tdee - 500);
  else if (fitnessGoal === "clean-bulk") targetCalories = tdee + 400;
  else if (fitnessGoal === "body-recomp") targetCalories = tdee - 200;

  // Macro calculation based on target protein density:
  // Extreme Shred: Protein high (2.2g per kg), Carbs low, Fats moderate
  // Clean Bulk: Protein moderate (1.8g per kg), Carbs high, Fats low-moderate
  // Recomp: Protein high (2.0g per kg), Carbs moderate, Fats moderate
  // Maintenance: Protein standard (1.6g per kg), balance carbs/fats
  let proteinGrams = 140;
  let carbsGrams = 230;
  let fatsGrams = 65;

  if (fitnessGoal === "extreme-shred") {
    proteinGrams = Math.round(weight * 2.2);
    // 1g protein = 4 kcal, 1g fat = 9 kcal
    const proteinKcal = proteinGrams * 4;
    const fatKcal = Math.round(targetCalories * 0.25);
    fatsGrams = Math.round(fatKcal / 9);
    const carbKcal = targetCalories - proteinKcal - fatKcal;
    carbsGrams = Math.max(30, Math.round(carbKcal / 4));
  } else if (fitnessGoal === "clean-bulk") {
    proteinGrams = Math.round(weight * 1.8);
    const proteinKcal = proteinGrams * 4;
    const fatKcal = Math.round(targetCalories * 0.22);
    fatsGrams = Math.round(fatKcal / 9);
    const carbKcal = targetCalories - proteinKcal - fatKcal;
    carbsGrams = Math.round(carbKcal / 4);
  } else if (fitnessGoal === "body-recomp") {
    proteinGrams = Math.round(weight * 2.0);
    const proteinKcal = proteinGrams * 4;
    const fatKcal = Math.round(targetCalories * 0.25);
    fatsGrams = Math.round(fatKcal / 9);
    const carbKcal = targetCalories - proteinKcal - fatKcal;
    carbsGrams = Math.round(carbKcal / 4);
  } else {
    // Maintenance
    proteinGrams = Math.round(weight * 1.6);
    const proteinKcal = proteinGrams * 4;
    const fatKcal = Math.round(targetCalories * 0.25);
    fatsGrams = Math.round(fatKcal / 9);
    const carbKcal = targetCalories - proteinKcal - fatKcal;
    carbsGrams = Math.round(carbKcal / 4);
  }

  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    onApplyTargets(targetCalories, proteinGrams, carbsGrams, fatsGrams);
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  };

  const activityLabels: Record<number, string> = {
    1.2: "Desk Job / Lazy Resets (Sedentary)",
    1.375: "Light Workouts 1-2 days/week",
    1.55: "Hypertrophy Lift Sets 3-5 days/week",
    1.725: "Heavy Compound Grinds 6-7 days/week",
    1.9: "Double Sessions Olympic Athletes"
  };

  const handleCopyClipboard = () => {
    const summary = 
      `📈 MY LIFE FITNESS GAINS SHEET\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• Weight: ${weight} KG  |  Height: ${height} CM  |  Age: ${age}\n` +
      `• Basal Metabolic Rate (BMR): ${bmr} kcal\n` +
      `• Active TDEE (Maintenance): ${tdee} kcal\n` +
      `• Goal Program: ${fitnessGoal.toUpperCase().replace("-", " ")}\n` +
      `• Daily Targeted Calories: ${targetCalories} kcal\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 RECOMMENDED DAILY MACRONUTRIENT RATIOS:\n` +
      `🍗 PROTEIN:      ${proteinGrams}g  (Muscle Hypertrophy)\n` +
      `🌾 CARBOHYDRATES: ${carbsGrams}g  (Glycogen & ATP Fuel)\n` +
      `🥑 HEALTHY FATS:  ${fatsGrams}g   (Hormone Split Support)\n` +
      `💧 IDEAL HYDRATION: ${Math.round(weight * 0.045 * 10) / 10} Liters daily\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Calculated live via Kalyar Fitness Member Portal. Keep tearing compound lines!`;
    
    navigator.clipboard.writeText(summary);
    alert("📋 Personal Macro gains copied to clipboard! Share it with your Coach.");
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6" id="gains-cal-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-850 pb-4">
        <div>
          <span className="text-emerald-500 text-[10px] uppercase font-black tracking-widest font-mono flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-500" /> Miflin-St Jeor Standard Calibration
          </span>
          <h3 className="text-white text-base font-black uppercase tracking-tight mt-0.5">Hydration & BMR Macro Planner</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyClipboard}
            className="bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white px-3 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Clipboard className="h-3.5 w-3.5 text-neutral-400" />
            Copy Sheet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* INPUTS: LEFT PANEL */}
        <div className="md:col-span-7 space-y-5">
          {/* Gender selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-neutral-500 uppercase font-black tracking-wider block">Athletic Gender</label>
            <div className="grid grid-cols-2 gap-3">
              {(["Male", "Female"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs uppercase cursor-pointer transition-all ${
                    gender === g
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                      : "bg-neutral-950 text-neutral-400 border-neutral-850 hover:text-white"
                  }`}
                >
                  {g === "Male" ? "♂️ MALE LIFTER" : "♀️ FEMALE LIFTER"}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders in grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Weight */}
            <div className="bg-neutral-950/40 border border-neutral-850/60 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase select-none">
                <span className="text-neutral-400">Weight</span>
                <span className="text-white font-mono">{weight} <span className="text-[9px] text-neutral-500">kg</span></span>
              </div>
              <input
                type="range"
                min="40"
                max="160"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1 rounded-full cursor-pointer bg-neutral-800"
              />
            </div>

            {/* Height */}
            <div className="bg-neutral-950/40 border border-neutral-850/60 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase select-none">
                <span className="text-neutral-400">Height</span>
                <span className="text-white font-mono">{height} <span className="text-[9px] text-neutral-500">cm</span></span>
              </div>
              <input
                type="range"
                min="130"
                max="220"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1 rounded-full cursor-pointer bg-neutral-800"
              />
            </div>

            {/* Age */}
            <div className="bg-neutral-950/40 border border-neutral-850/60 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase select-none">
                <span className="text-neutral-400">Age</span>
                <span className="text-white font-mono">{age} <span className="text-[9px] text-neutral-500">yrs</span></span>
              </div>
              <input
                type="range"
                min="14"
                max="80"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1 rounded-full cursor-pointer bg-neutral-800"
              />
            </div>
          </div>

          {/* Activity Level selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-neutral-500 uppercase font-black tracking-wider block">Weekly Activity Level Split</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(parseFloat(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-850 text-white rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {Object.entries(activityLabels).map(([val, label]) => (
                <option key={val} value={val} className="bg-neutral-950">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Fitness Goals presets */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-neutral-500 uppercase font-black tracking-wider block">Calorie Target Goal Preset</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "extreme-shred", name: "☄️ SHRED (-500)" },
                { id: "body-recomp", name: "🔥 RECOMP (-200)" },
                { id: "maintenance", name: "⚓ MAINTAIN (0)" },
                { id: "clean-bulk", name: "⚡ BULK (+400)" }
              ].map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setFitnessGoal(goal.id as any)}
                  className={`py-2 px-1 text-center rounded-xl border text-[9px] font-black uppercase cursor-pointer transition-all truncate ${
                    fitnessGoal === goal.id
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                      : "bg-neutral-950 text-neutral-400 border-neutral-850 hover:text-white"
                  }`}
                >
                  {goal.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CALCULATIONS: RIGHT PANEL */}
        <div className="md:col-span-5 bg-neutral-950 p-6 border border-neutral-850 rounded-3xl space-y-4 flex flex-col justify-between relative overflow-hidden select-none">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl" />
          <div className="space-y-4">
            <div className="border-b border-neutral-900 pb-3">
              <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block font-mono">Calibrated Metrices Output</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-white text-3xl font-black font-mono tracking-tight">{targetCalories}</span>
                <span className="text-xs text-neutral-500 uppercase font-bold">kcal/day</span>
              </div>
            </div>

            {/* Calculations metrics lists */}
            <div className="space-y-2.5 text-xs text-neutral-400 font-bold leading-normal">
              <div className="flex justify-between">
                <span>Basal Metabolism (BMR)</span>
                <span className="text-white font-mono">{bmr} kcal</span>
              </div>
              <div className="flex justify-between">
                <span>Total Expenditure (TDEE)</span>
                <span className="text-white font-mono">{tdee} kcal</span>
              </div>
              <div className="flex justify-between">
                <span>Goal Strategy Shift</span>
                <span className="text-emerald-400 uppercase">
                  {fitnessGoal === "extreme-shred" ? "Calorie Deficit" : fitnessGoal === "clean-bulk" ? "Calorie Surplus" : "Slight Deficit"}
                </span>
              </div>
              <div className="flex justify-between border-t border-neutral-900 pt-2.5">
                <span>Target Daily Hydration</span>
                <span className="text-blue-400 font-mono font-black">{Math.round(weight * 0.045 * 10) / 10} Liters</span>
              </div>
            </div>

            {/* Macros Distribution blocks */}
            <div className="space-y-2.5 pt-1.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-neutral-900 p-2 text-center rounded-xl border border-neutral-850/80">
                  <span className="text-red-500 text-[8px] block uppercase font-mono tracking-wider font-extrabold">Protein</span>
                  <span className="text-white text-sm block font-mono font-black mt-0.5">{proteinGrams}g</span>
                  <span className="text-neutral-500 text-[8px] block font-semibold leading-none mt-1">{proteinGrams * 4} kcal</span>
                </div>
                <div className="bg-neutral-900 p-2 text-center rounded-xl border border-neutral-850/80">
                  <span className="text-yellow-500 text-[8px] block uppercase font-mono tracking-wider font-extrabold">Carbs</span>
                  <span className="text-white text-sm block font-mono font-black mt-0.5">{carbsGrams}g</span>
                  <span className="text-neutral-500 text-[8px] block font-semibold leading-none mt-1">{carbsGrams * 4} kcal</span>
                </div>
                <div className="bg-neutral-900 p-2 text-center rounded-xl border border-neutral-850/80">
                  <span className="text-blue-400 text-[8px] block uppercase font-mono tracking-wider font-extrabold">Fats</span>
                  <span className="text-white text-sm block font-mono font-black mt-0.5">{fatsGrams}g</span>
                  <span className="text-neutral-500 text-[8px] block font-semibold leading-none mt-1">{fatsGrams * 9} kcal</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleApply}
            className={`w-full py-2.5 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
              applied
                ? "bg-green-600 border-green-500 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 border-emerald-400 hover:border-emerald-500 text-black shadow-lg shadow-emerald-500/10 active:scale-95"
            }`}
          >
            {applied ? (
              <>
                <Check className="h-4 w-4 text-white" />
                Applied Successfully!
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Apply Active Targets
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
