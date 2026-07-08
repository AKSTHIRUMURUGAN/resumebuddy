export interface ATSScoreResult {
  overallScore: number;
  breakdown: {
    atsScore: number;
    recruiterScore: number;
    contentScore: number;
    impactScore: number;
    keywordScore: number;
    readabilityScore: number;
    grammarScore: number;
  };
  missingKeywords: string[];
  matchedKeywords: string[];
  recruiterRedFlags: string[];
  improvements: Array<{
    section: string;
    issue: string;
    suggestion: string;
    autofixText?: string;
  }>;
}

const ACTION_VERBS = [
  "designed", "developed", "engineered", "architected", "optimized",
  "implemented", "automated", "led", "managed", "created", "built",
  "reduced", "increased", "boosted", "accelerated", "deployed"
];

const WEAK_WORDS = ["helped", "assisted", "worked", "did", "made", "responsible for"];

export function analyzeResumeWithRules(resume: any, jobKeywords: string[] = []): ATSScoreResult {
  const improvements: any[] = [];
  const redFlags: string[] = [];
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  let sectionsScore = 100;
  let formattingScore = 100;
  let impactScore = 50; // starts low, rewards metrics
  let grammarScore = 95; // base mock grammar
  let actionVerbCount = 0;
  let hasMetrics = false;

  const { personalInfo = {}, skills = [], experience = [], projects = [], education = [], formatting = {} } = resume;

  // 1. Sections & Content Completeness Check
  if (!personalInfo.summary) {
    sectionsScore -= 15;
    improvements.push({
      section: "Summary",
      issue: "Missing professional summary statement",
      suggestion: "Add a 2-3 sentence overview highlighting your target role, years of experience, and primary core technologies.",
      autofixText: "Result-driven Software Engineer with extensive experience building scalable MERN stack web applications and optimizing system performance."
    });
  }

  if (experience.length === 0) {
    sectionsScore -= 30;
    improvements.push({
      section: "Experience",
      issue: "No work experience listed",
      suggestion: "Add your previous job positions, listing company, role title, and bullet accomplishment points."
    });
  }

  if (skills.length === 0) {
    sectionsScore -= 20;
    improvements.push({
      section: "Skills",
      issue: "Skills matrix is empty",
      suggestion: "Define a flat array of technical programming skills, tools, and methodologies in your resume profile."
    });
  }

  if (projects.length === 0) {
    sectionsScore -= 15;
    improvements.push({
      section: "Projects",
      issue: "Missing project highlights",
      suggestion: "Showcase 2-3 personal or professional projects, highlighting technical architectures and quantified impact."
    });
  }

  // 2. Contact validation checks
  if (!personalInfo.email) {
    redFlags.push("Missing email contact detail");
  } else if (!personalInfo.email.includes("@")) {
    redFlags.push("Invalid email address format");
  }

  if (!personalInfo.phone) {
    redFlags.push("Missing contact phone number");
  }

  if (!personalInfo.linkedin) {
    improvements.push({
      section: "Contact",
      issue: "No LinkedIn URL provided",
      suggestion: "Include a link to your LinkedIn profile to increase recruiter credibility metrics."
    });
  }

  // 3. Formatting parameter checks
  if (formatting.fontSize && (formatting.fontSize < 10 || formatting.fontSize > 12)) {
    formattingScore -= 20;
    improvements.push({
      section: "Formatting",
      issue: "Suboptimal font size configuration",
      suggestion: "Configure standard document font sizes between 10px and 12px to maximize readability index score."
    });
  }

  // 4. Bullet analysis (Verbs & Metrics check)
  let totalBullets = 0;
  let weakWordCount = 0;

  const experiencePoints = experience || [];
  experiencePoints.forEach((exp: any) => {
    const highlights = exp.highlights || [];
    highlights.forEach((hl: string) => {
      totalBullets++;
      const lowerHl = hl.toLowerCase();

      // Check action verbs
      ACTION_VERBS.forEach(verb => {
        if (lowerHl.includes(verb)) actionVerbCount++;
      });

      // Check weak words
      WEAK_WORDS.forEach(weak => {
        if (lowerHl.includes(weak)) {
          weakWordCount++;
          improvements.push({
            section: "Experience",
            issue: `Used weak verb "${weak}"`,
            suggestion: `Replace "${weak}" in your experience highlight with a strong action verb like "Architected" or "Engineered".`
          });
        }
      });

      // Check metrics (digits, %, $)
      if (/\d+/.test(lowerHl) || lowerHl.includes("%") || lowerHl.includes("$")) {
        hasMetrics = true;
        impactScore += 10;
      }
    });
  });

  if (totalBullets > 0) {
    if (actionVerbCount / totalBullets < 0.5) {
      improvements.push({
        section: "Impact",
        issue: "Low percentage of action verbs",
        suggestion: "Ensure at least 60% of your experience bullets start with powerful action verbs."
      });
    }
  }

  if (!hasMetrics) {
    redFlags.push("No quantified metrics/results in experiences");
    improvements.push({
      section: "Impact",
      issue: "Missing measurable results",
      suggestion: "Add quantified results (e.g. 'reduced latency by 30%', 'served 500+ users') to show exact impact.",
      autofixText: "Optimized application load speed by 40% through lazy loading and API caching."
    });
  }

  impactScore = Math.min(100, Math.max(30, impactScore));

  // 5. Keyword match checks
  if (jobKeywords.length > 0) {
    // extract matching
    const resumeText = JSON.stringify(resume).toLowerCase();
    jobKeywords.forEach(kw => {
      if (resumeText.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });
  }

  const keywordScore = jobKeywords.length > 0 
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100) 
    : 70; // baseline if no JD supplied

  // Score aggregations
  const atsScore = Math.round((sectionsScore * 0.4) + (formattingScore * 0.3) + (keywordScore * 0.3));
  const recruiterScore = Math.round((impactScore * 0.5) + (sectionsScore * 0.3) + (formattingScore * 0.2));
  const readabilityScore = formattingScore;
  const contentScore = sectionsScore;

  const overallScore = Math.round(
    (atsScore * 0.3) + 
    (recruiterScore * 0.2) + 
    (contentScore * 0.2) + 
    (impactScore * 0.1) + 
    (keywordScore * 0.1) + 
    (readabilityScore * 0.1)
  );

  return {
    overallScore: Math.min(100, Math.max(10, overallScore)),
    breakdown: {
      atsScore,
      recruiterScore,
      contentScore,
      impactScore,
      keywordScore,
      readabilityScore,
      grammarScore
    },
    missingKeywords,
    matchedKeywords,
    recruiterRedFlags: redFlags,
    improvements
  };
}
