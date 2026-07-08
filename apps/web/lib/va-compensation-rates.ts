export type DisabilityRating = 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;

export interface VaCompensationInput {
  rating: DisabilityRating;
  hasSpouse: boolean;
  childrenUnder18: number;
  childrenInSchool: number;
  dependentParents: 0 | 1 | 2;
  spouseAidAndAttendance: boolean;
}

const BASE_ALONE: Record<number, number> = {
  10: 180.42,
  20: 356.66,
  30: 552.47,
  40: 795.84,
  50: 1132.9,
  60: 1435.02,
  70: 1808.45,
  80: 2102.15,
  90: 2362.3,
  100: 3938.58
};

const WITH_SPOUSE: Record<number, number> = {
  30: 617.47,
  40: 882.84,
  50: 1241.9,
  60: 1566.02,
  70: 1961.45,
  80: 2277.15,
  90: 2559.3,
  100: 4158.17
};

const WITH_SPOUSE_AND_CHILD: Record<number, number> = {
  30: 666.47,
  40: 947.84,
  50: 1322.9,
  60: 1663.02,
  70: 2074.45,
  80: 2406.15,
  90: 2704.3,
  100: 4318.99
};

const WITH_CHILD_ONLY: Record<number, number> = {
  30: 595.67,
  40: 853.79,
  50: 1205.6,
  60: 1522.47,
  70: 1913.45,
  80: 2225.15,
  90: 2503.3,
  100: 4066.65
};

const WITH_ONE_PARENT: Record<number, number> = {
  30: 604.47,
  40: 865.84,
  50: 1220.9,
  60: 1540.02,
  70: 1931.45,
  80: 2242.15,
  90: 2520.3,
  100: 4114.82
};

const WITH_TWO_PARENTS: Record<number, number> = {
  30: 656.47,
  40: 935.84,
  50: 1308.9,
  60: 1645.02,
  70: 2054.45,
  80: 2382.15,
  90: 2678.3,
  100: 4291.06
};

const EXTRA_CHILD_UNDER_18: Record<number, number> = {
  30: 32.66,
  40: 43.2,
  50: 53.74,
  60: 65.33,
  70: 75.92,
  80: 86.51,
  90: 97.1,
  100: 106.14
};

const EXTRA_CHILD_IN_SCHOOL: Record<number, number> = {
  30: 106.06,
  40: 141.08,
  50: 176.1,
  60: 211.12,
  70: 246.14,
  80: 281.16,
  90: 316.18,
  100: 351.2
};

const SPOUSE_AA: Record<number, number> = {
  30: 61,
  40: 81,
  50: 101,
  60: 121,
  70: 141,
  80: 161,
  90: 181,
  100: 201.41
};

const PARENT_ADDITION: Record<number, number> = {
  30: 52,
  40: 70,
  50: 88,
  60: 105,
  70: 123,
  80: 140,
  90: 158,
  100: 176.24
};

export function calculateVaCompensation(input: VaCompensationInput): {
  monthly: number;
  annual: number;
  note?: string;
} {
  const { rating } = input;

  if (rating === 0) {
    return { monthly: 0, annual: 0, note: "Select a disability rating to estimate monthly compensation." };
  }

  if (rating < 30) {
    return {
      monthly: BASE_ALONE[rating],
      annual: BASE_ALONE[rating] * 12,
      note: "Dependent additions generally apply at 30% or higher. Rates shown are for veteran alone."
    };
  }

  let monthly = BASE_ALONE[rating];

  if (input.hasSpouse && input.childrenUnder18 + input.childrenInSchool === 0 && input.dependentParents === 0) {
    monthly = WITH_SPOUSE[rating];
  } else if (input.hasSpouse && input.childrenUnder18 + input.childrenInSchool >= 1 && input.dependentParents === 0) {
    monthly = WITH_SPOUSE_AND_CHILD[rating];
    const totalChildren = input.childrenUnder18 + input.childrenInSchool;
    if (totalChildren > 1) {
      monthly += EXTRA_CHILD_UNDER_18[rating] * Math.max(0, input.childrenUnder18 - 1);
      monthly += EXTRA_CHILD_IN_SCHOOL[rating] * input.childrenInSchool;
    } else if (input.childrenInSchool === 1 && input.childrenUnder18 === 0) {
      monthly += EXTRA_CHILD_IN_SCHOOL[rating] - EXTRA_CHILD_UNDER_18[rating];
    }
  } else if (!input.hasSpouse && input.childrenUnder18 + input.childrenInSchool >= 1 && input.dependentParents === 0) {
    monthly = WITH_CHILD_ONLY[rating];
    const totalChildren = input.childrenUnder18 + input.childrenInSchool;
    if (totalChildren > 1) {
      monthly += EXTRA_CHILD_UNDER_18[rating] * Math.max(0, input.childrenUnder18 - 1);
      monthly += EXTRA_CHILD_IN_SCHOOL[rating] * input.childrenInSchool;
    }
  } else if (input.dependentParents === 1 && !input.hasSpouse && input.childrenUnder18 + input.childrenInSchool === 0) {
    monthly = WITH_ONE_PARENT[rating];
  } else if (input.dependentParents === 2 && !input.hasSpouse && input.childrenUnder18 + input.childrenInSchool === 0) {
    monthly = WITH_TWO_PARENTS[rating];
  } else {
    monthly = BASE_ALONE[rating];
    if (input.hasSpouse) monthly += WITH_SPOUSE[rating] - BASE_ALONE[rating];
    if (input.dependentParents > 0) monthly += PARENT_ADDITION[rating] * input.dependentParents;
    if (input.childrenUnder18 > 0) {
      monthly += input.hasSpouse ? WITH_SPOUSE_AND_CHILD[rating] - WITH_SPOUSE[rating] : WITH_CHILD_ONLY[rating] - BASE_ALONE[rating];
      if (input.childrenUnder18 > 1) monthly += EXTRA_CHILD_UNDER_18[rating] * (input.childrenUnder18 - 1);
    }
    if (input.childrenInSchool > 0) monthly += EXTRA_CHILD_IN_SCHOOL[rating] * input.childrenInSchool;
  }

  if (input.spouseAidAndAttendance && input.hasSpouse) {
    monthly += SPOUSE_AA[rating];
  }

  monthly = Math.round(monthly * 100) / 100;

  return {
    monthly,
    annual: Math.round(monthly * 12 * 100) / 100,
    note: "Estimate based on 2026 VA rates (effective Dec 1, 2025). Confirm at va.gov."
  };
}

export const disabilityRatingOptions: DisabilityRating[] = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
