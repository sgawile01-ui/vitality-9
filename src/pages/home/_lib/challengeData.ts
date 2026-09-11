import { CHALLENGE_DAYS } from "../../../../convex/challengeData";
export const CHALLENGE_DAYS_FE = CHALLENGE_DAYS;
export const NINE_PILLARS_PHILOSOPHY = {
  headline: "Nine everyday pillars",
  intro: "A flexible journey through habits that can support everyday wellbeing.",
  meaning:
    "Go at your own pace. These activities are invitations, not treatments or requirements. Your circumstances and care team's advice come first.",
  pillars: CHALLENGE_DAYS.map((d) => ({
    number: d.day,
    theme: d.theme,
    pillar: d.pillar,
    icon: "",
  })),
};
