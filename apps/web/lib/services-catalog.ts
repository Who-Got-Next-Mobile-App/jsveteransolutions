export interface ServicePackage {
  id: string;
  name: string;
  price: string;
  description: string;
}

export const servicePackages: ServicePackage[] = [
  {
    id: "pathfinder",
    name: "Pathfinder Session",
    price: "$100",
    description:
      "One-time enrollment in our 1-hour group info session (held once a month) covering VA claims basics and live Q&A."
  },
  {
    id: "compass",
    name: "Compass Review",
    price: "$250",
    description: "Individual appraisal, condition identification, next-step recommendations, and documentation checklist."
  },
  {
    id: "navigator",
    name: "Navigator Package",
    price: "$500",
    description: "Appraisal report and claims plan with documentation recommendations and strategy guidance."
  },
  {
    id: "advocate",
    name: "Advocate Package",
    price: "$900",
    description:
      "Appraisal report, claims plan, and professional deliverables including condition summary, evidence outline, claim support documents, and claim checklist."
  },
  {
    id: "elite",
    name: "Elite Package",
    price: "$1,400",
    description:
      "Appraisal report, claims plan, professional deliverables, mock C&P exam, examiner strategy guide, and final checklist."
  }
];
