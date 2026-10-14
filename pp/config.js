/* Prakriti Parikshana – configuration */
window.PP_CONFIG = {
  // Two doshas whose shares differ by less than this (percentage points) form a mixed type.
  MIXED_THRESHOLD: 10,
  // Show an "uncertain result" note when this many extra ticks (or fewer) of the second dosha would swap the order.
  UNCERTAIN_TRAITS: 2,
  // localStorage keys are prefixed so they don't collide with other pages on the same domain.
  STORAGE_KEY: "pp-state-v1",
  LANG_KEY: "pp-lang",
  VERSION: "1.1.0"
};
