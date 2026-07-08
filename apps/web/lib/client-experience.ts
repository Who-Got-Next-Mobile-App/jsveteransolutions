export interface ClientExperienceStep {
  step: number;
  title: string;
  description: string;
  bullets?: string[];
  footnote?: string;
  cta?: { label: string; href: string };
}

export const CLIENT_EXPERIENCE_TITLE = "The Client Experience";

export const clientExperienceIntro =
  "From your first consultation through follow-up support, here is what you can expect when working with JS Veteran Solutions — clear steps, secure communication, and guidance tailored to your individual situation.";

export const clientExperienceTeaser =
  "A straightforward path from scheduling your consultation to personalized recommendations and ongoing education — all through your secure client portal.";

export const clientExperienceSteps: ClientExperienceStep[] = [
  {
    step: 1,
    title: "Schedule a Consultation",
    description:
      "Begin by selecting the service that best fits your needs. Once your appointment is confirmed, you'll receive secure access to your client portal.",
    cta: { label: "Schedule Consultation", href: "/book" }
  },
  {
    step: 2,
    title: "Complete Your Intake",
    description:
      "Complete a guided questionnaire so we can better understand your history, goals, and current stage in the VA claims process."
  },
  {
    step: 3,
    title: "Securely Upload Your Records",
    description: "Upload your available records through your secure client portal. This may include:",
    bullets: [
      "VA decision letters",
      "Service treatment records",
      "Private medical records",
      "DBQs",
      "Supporting documentation"
    ],
    footnote: "If you don't have everything yet, we'll explain what can be added later."
  },
  {
    step: 4,
    title: "Professional Review",
    description:
      "Your information is reviewed to understand your situation, organize available evidence, and identify areas that may require additional documentation or clarification."
  },
  {
    step: 5,
    title: "Consultation",
    description:
      "Meet one-on-one to discuss your case, ask questions, and receive guidance based on your individual circumstances."
  },
  {
    step: 6,
    title: "Personalized Recommendations",
    description:
      "Following your consultation, you'll receive recommendations, educational resources, and suggested next steps appropriate for your situation."
  },
  {
    step: 7,
    title: "Continue Learning",
    description:
      "Your client portal includes educational resources, checklists, and frequently asked questions designed to help you better understand the process."
  },
  {
    step: 8,
    title: "Follow-Up (If Needed)",
    description:
      "Some clients require only one consultation, while others may benefit from additional support depending on where they are in the claims process."
  }
];

export const whatWeDontDo: string[] = [
  "We do not guarantee VA decisions.",
  "We do not make decisions on behalf of the VA.",
  "We do not provide legal representation.",
  "We do not replace your healthcare providers.",
  "We do not submit claims on your behalf unless specifically stated.",
  "We do not promise outcomes."
];

export const whatMakesUsDifferent: string[] = [
  "Evidence-based consultation",
  "Personalized education",
  "Secure client portal",
  "Organized document management",
  "Transparent communication",
  "Individualized recommendations",
  "Trusted professional resource network",
  "Ongoing educational materials"
];
