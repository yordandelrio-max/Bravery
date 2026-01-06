
export const BRAVERY_DATA = {
  KCAL: {
    DOG_ADULT: 3900,
    DOG_LIGHT: 3400, // Estimated for light formulas
    CAT_KITTEN: 4020,
    CAT_ADULT: 3795,
    CAT_STERILIZED: 3575
  },
  DOG_PUPPY_MED_LARGE: {
    // Adult Weight Target (kg) -> { Month: Grams }
    12: { 2: 102, 4: 117, 6: 172, 8: 218, 10: 216, 12: 212 },
    20: { 2: 150, 4: 173, 6: 252, 8: 320, 10: 316, 12: 312 },
    30: { 2: 203, 4: 234, 6: 342, 8: 434, 10: 432, 12: 428 },
    40: { 2: 252, 4: 291, 6: 422, 8: 538, 10: 536, 12: 530 },
    50: { 2: 298, 4: 344, 6: 500, 8: 636, 10: 634, 12: 630 },
    60: { 2: 342, 4: 395, 6: 572, 8: 729, 10: 726, 12: 722 }
  },
  DOG_PUPPY_MINI: {
    // Current Weight (kg) -> { Month: Grams }
    1: { 2: 16, 4: 31, 6: 28, 8: 30, 10: 28 },
    3: { 2: 35, 4: 68, 6: 64, 8: 67, 10: 64 },
    5: { 2: 52, 4: 94, 6: 98, 8: 98, 10: 94 },
    7: { 2: 67, 4: 121, 6: 127, 8: 136, 10: 124 },
    10: { 2: 87, 4: 159, 6: 166, 8: 172, 10: 162 }
  },
  DOG_ADULT_MINI: {
    1: 29, 2: 43, 4: 73, 6: 98, 8: 122, 10: 144
  },
  DOG_ADULT_MED_LARGE: {
    12: 192, 20: 282, 30: 383, 40: 475, 50: 561, 60: 644
  },
  CAT_KITTEN: {
    // Age Range -> Grams
    '1-2': 25, // average of 20-30
    '2-4': 45, // average of 30-60
    '4-6': 67, // average of 60-75
    '6-9': 79, // average of 75-84
    '9-12': 87  // average of 84-90
  },
  CAT_ADULT: {
    1: 23, 2: 36, 4: 69, 6: 103, 8: 136
  },
  CAT_STERILIZED: {
    2: 30, 4: 62
  }
};

export const TRANSITION_PLAN = [
  { days: "1-2", bravery: 25, old: 75, reason: "Inicio de colonización bacteriana." },
  { days: "3-4", bravery: 50, old: 50, reason: "Estabilización del pH gástrico." },
  { days: "5-6", bravery: 75, old: 25, reason: "Optimización de absorción de aminoácidos." },
  { days: "7+", bravery: 100, old: 0, reason: "Transición completa." }
];
