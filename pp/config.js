/* Prakriti Parikshana – configuration */
window.PP_CONFIG = {
  // Two doshas whose shares differ by less than this (percentage points) form a mixed type.
  MIXED_THRESHOLD: 10,
  // "Uncertain result" note when adding or unticking this many traits (or fewer) of one dosha changes the result.
  UNCERTAIN_TRAITS: 2,
  // "Preliminary result" note when fewer sections than this have any tick, or fewer ticks than MIN_TICKS.
  MIN_SECTIONS: 20,
  MIN_TICKS: 27,
  // localStorage keys are prefixed so they don't collide with other pages on the same domain.
  // Suggested season from the examination date, for Poland (our approximation, not a classical text).
  // Each entry: the ṛtu that starts on that month-day (MM-DD).
  RITU_PL: [
    { ritu: "sisira",  from: "01-01" },
    { ritu: "vasanta", from: "03-01" },
    { ritu: "grishma", from: "06-01" },
    { ritu: "varsha",  from: "07-16" },
    { ritu: "sharad",  from: "09-01" },
    { ritu: "hemanta", from: "11-01" }
  ],
  STORAGE_KEY: "pp-state-v1",
  LANG_KEY: "pp-lang",
  HINT_KEY: "pp-hint-open",
  VERSION: "1.4.0"
};
