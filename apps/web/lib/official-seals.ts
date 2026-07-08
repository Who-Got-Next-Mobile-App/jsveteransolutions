export interface OfficialSeal {
  src: string;
  alt: string;
  label: string;
  source: string;
}

/** Official U.S. government seals from Wikimedia Commons (public domain). */
export const officialSeals: OfficialSeal[] = [
  {
    src: "/logos/army.svg",
    alt: "Seal of the U.S. Department of the Army",
    label: "Army",
    source: "https://commons.wikimedia.org/wiki/File:United_States_Department_of_the_Army_Seal.svg"
  },
  {
    src: "/logos/navy.svg",
    alt: "Seal of the U.S. Department of the Navy",
    label: "Navy",
    source: "https://commons.wikimedia.org/wiki/File:Seal_of_the_United_States_Department_of_the_Navy.svg"
  },
  {
    src: "/logos/air-force.svg",
    alt: "Seal of the U.S. Air Force",
    label: "Air Force",
    source: "https://commons.wikimedia.org/wiki/File:Seal_of_the_U.S._Air_Force.svg"
  },
  {
    src: "/logos/marines.svg",
    alt: "Seal of the U.S. Marine Corps",
    label: "Marines",
    source: "https://commons.wikimedia.org/wiki/File:Seal_of_the_United_States_Marine_Corps.svg"
  },
  {
    src: "/logos/coast-guard.svg",
    alt: "Seal of the U.S. Coast Guard",
    label: "Coast Guard",
    source: "https://commons.wikimedia.org/wiki/File:Seal_of_the_United_States_Coast_Guard.svg"
  },
  {
    src: "/logos/space-force.png",
    alt: "Seal of the U.S. Space Force",
    label: "Space Force",
    source: "https://commons.wikimedia.org/wiki/File:Seal_of_the_United_States_Space_Force.svg"
  },
  {
    src: "/logos/va.png",
    alt: "Seal of the U.S. Department of Veterans Affairs",
    label: "VA",
    source: "https://commons.wikimedia.org/wiki/File:Seal_of_the_U.S._Department_of_Veterans_Affairs.svg"
  }
];
