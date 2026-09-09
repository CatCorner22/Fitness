/**
 * Citation registry for the meal-plan module.
 *
 * Every number the planner uses points at one of these. Primary sources are
 * peer-reviewed US medical / scientific publications or US federal
 * guidelines. A short "supporting" list of non-US studies is labelled as such
 * where the US literature leans on them.
 */

export type EvidenceId =
  | "mifflin-1990"
  | "frankenfield-2005"
  | "aha-acc-tos-2013"
  | "issn-diets-2017"
  | "issn-protein-2017"
  | "issn-timing-2017"
  | "helms-2014-jissn"
  | "iraki-2019"
  | "schoenfeld-aragon-2018"
  | "mamerow-2014"
  | "schoenfeld-2015-frequency"
  | "murphy-koehler-2022"
  | "hall-2008"
  | "hall-2011"
  | "weinheimer-2010"
  | "hudson-2020"
  | "iom-2005-macros"
  | "iom-2004-water"
  | "dga-2020"
  | "antonio-2015"
  | "barakat-2020"
  | "ace-bodyfat"
  | "garthe-2011"
  | "longland-2016"
  | "morton-2018";

export type Evidence = {
  id: EvidenceId;
  /** Short inline label, e.g. "ISSN 2017 (diets)". */
  short: string;
  citation: string;
  institution: string;
  country: "US" | "Non-US (supporting)";
  /** What the planner takes from it. */
  claim: string;
  url?: string;
};

export const EVIDENCE: Record<EvidenceId, Evidence> = {
  "mifflin-1990": {
    id: "mifflin-1990",
    short: "Mifflin-St Jeor 1990",
    citation:
      "Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241-247.",
    institution: "University of Nevada, Reno",
    country: "US",
    claim: "Resting energy expenditure = 10·kg + 6.25·cm − 5·age + 5 (men) / −161 (women).",
    url: "https://doi.org/10.1093/ajcn/51.2.241",
  },
  "frankenfield-2005": {
    id: "frankenfield-2005",
    short: "Frankenfield 2005",
    citation:
      "Frankenfield D, Roth-Yousey L, Compher C. Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. J Am Diet Assoc. 2005;105(5):775-789.",
    institution: "Academy of Nutrition and Dietetics Evidence Analysis Library",
    country: "US",
    claim: "Mifflin-St Jeor was the most reliable prediction equation in both non-obese and obese adults; still ±10% for many individuals, so weigh-ins must correct it.",
    url: "https://doi.org/10.1016/j.jada.2005.02.005",
  },
  "aha-acc-tos-2013": {
    id: "aha-acc-tos-2013",
    short: "AHA/ACC/TOS 2013",
    citation:
      "Jensen MD, Ryan DH, Apovian CM, et al. 2013 AHA/ACC/TOS Guideline for the Management of Overweight and Obesity in Adults. Circulation. 2014;129(25 Suppl 2):S102-S138.",
    institution: "American Heart Association / American College of Cardiology / The Obesity Society",
    country: "US",
    claim: "Prescribe a 500–750 kcal/day deficit, or 1,200–1,500 kcal/day (women) / 1,500–1,800 kcal/day (men). Very-low-calorie diets (<800 kcal) only under medical supervision.",
    url: "https://doi.org/10.1161/01.cir.0000437739.71477.ee",
  },
  "issn-diets-2017": {
    id: "issn-diets-2017",
    short: "ISSN 2017 (diets & body composition)",
    citation:
      "Aragon AA, Schoenfeld BJ, Wildman R, et al. International Society of Sports Nutrition position stand: diets and body composition. J Int Soc Sports Nutr. 2017;14:16.",
    institution: "International Society of Sports Nutrition",
    country: "US",
    claim:
      "Fat loss is driven by a sustained deficit; the higher the starting body fat, the more aggressive the deficit may be, and slower loss preserves lean mass in leaner people. Lean-mass gain needs a sustained surplus. Lean resistance-trained people in a deficit may need 2.3–3.1 g/kg fat-free mass protein.",
    url: "https://doi.org/10.1186/s12970-017-0174-y",
  },
  "issn-protein-2017": {
    id: "issn-protein-2017",
    short: "ISSN 2017 (protein)",
    citation:
      "Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition position stand: protein and exercise. J Int Soc Sports Nutr. 2017;14:20.",
    institution: "International Society of Sports Nutrition",
    country: "US",
    claim: "1.4–2.0 g/kg/day protein builds and maintains muscle in exercising people; higher intakes (>3.0 g/kg) may help lose fat mass in resistance-trained individuals. Distribute protein every 3–4 h across the day.",
    url: "https://doi.org/10.1186/s12970-017-0177-8",
  },
  "issn-timing-2017": {
    id: "issn-timing-2017",
    short: "ISSN 2017 (nutrient timing)",
    citation:
      "Kerksick CM, Arent S, Schoenfeld BJ, et al. International Society of Sports Nutrition position stand: nutrient timing. J Int Soc Sports Nutr. 2017;14:33.",
    institution: "International Society of Sports Nutrition",
    country: "US",
    claim: "Total daily protein and calories matter most; the post-exercise 'window' is several hours wide. Meeting daily needs with protein spread across meals every 3–4 h is the practical timing target.",
    url: "https://doi.org/10.1186/s12970-017-0189-4",
  },
  "helms-2014-jissn": {
    id: "helms-2014-jissn",
    short: "Helms, Aragon & Fitschen 2014",
    citation:
      "Helms ER, Aragon AA, Fitschen PJ. Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. J Int Soc Sports Nutr. 2014;11:20.",
    institution: "Auckland University of Technology / California State University / University of Illinois",
    country: "US",
    claim: "Lose ~0.5–1% of bodyweight per week to keep muscle; protein 2.3–3.1 g/kg lean mass; fat 15–30% of calories; carbs fill the remainder.",
    url: "https://doi.org/10.1186/1550-2783-11-20",
  },
  "iraki-2019": {
    id: "iraki-2019",
    short: "Iraki 2019 (off-season)",
    citation:
      "Iraki J, Fitschen P, Espinar S, Helms E. Nutrition recommendations for bodybuilders in the off-season: a narrative review. Sports (Basel). 2019;7(7):154.",
    institution: "University of Illinois at Chicago / Auckland University of Technology",
    country: "US",
    claim: "Gain at ~0.25–0.5% bodyweight/week on a ~10–20% surplus; protein 1.6–2.2 g/kg/day at 0.40–0.55 g/kg per meal over 3–6 meals; fat 0.5–1.5 g/kg; carbs ≥3–5 g/kg from what is left.",
    url: "https://doi.org/10.3390/sports7070154",
  },
  "schoenfeld-aragon-2018": {
    id: "schoenfeld-aragon-2018",
    short: "Schoenfeld & Aragon 2018",
    citation:
      "Schoenfeld BJ, Aragon AA. How much protein can the body use in a single meal for muscle-building? Implications for daily protein distribution. J Int Soc Sports Nutr. 2018;15:10.",
    institution: "Lehman College, City University of New York",
    country: "US",
    claim: "Target ~0.4 g/kg protein per meal across at least four meals to reach 1.6 g/kg/day; 0.55 g/kg per meal reaches 2.2 g/kg/day.",
    url: "https://doi.org/10.1186/s12970-018-0215-1",
  },
  "mamerow-2014": {
    id: "mamerow-2014",
    short: "Mamerow 2014",
    citation:
      "Mamerow MM, Mettler JA, English KL, et al. Dietary protein distribution positively influences 24-h muscle protein synthesis in healthy adults. J Nutr. 2014;144(6):876-880.",
    institution: "University of Texas Medical Branch, Galveston",
    country: "US",
    claim: "An even ~30 g/meal protein pattern produced ~25% higher 24-h muscle protein synthesis than the same total skewed toward dinner.",
    url: "https://doi.org/10.3945/jn.113.185280",
  },
  "schoenfeld-2015-frequency": {
    id: "schoenfeld-2015-frequency",
    short: "Schoenfeld 2015 (meal frequency)",
    citation:
      "Schoenfeld BJ, Aragon AA, Krieger JW. Effects of meal frequency on weight loss and body composition: a meta-analysis. Nutr Rev. 2015;73(2):69-82.",
    institution: "Lehman College, City University of New York",
    country: "US",
    claim: "With calories and protein matched, meal frequency does not change fat loss. Pick the meal count you can stick to.",
    url: "https://doi.org/10.1093/nutrit/nuu017",
  },
  "murphy-koehler-2022": {
    id: "murphy-koehler-2022",
    short: "Murphy & Koehler 2022",
    citation:
      "Murphy C, Koehler K. Energy deficiency impairs resistance training gains in lean mass but not strength: a meta-analysis and meta-regression. Scand J Med Sci Sports. 2022;32(1):125-137.",
    institution: "University of Nebraska–Lincoln",
    country: "US",
    claim: "A ~500 kcal/day deficit fully blunts lean-mass gains from lifting; people cutting to keep muscle should stay at or under ~500 kcal/day below expenditure.",
    url: "https://doi.org/10.1111/sms.14075",
  },
  "hall-2008": {
    id: "hall-2008",
    short: "Hall 2008",
    citation:
      "Hall KD. What is the required energy deficit per unit weight loss? Int J Obes (Lond). 2008;32(3):573-576.",
    institution: "National Institute of Diabetes and Digestive and Kidney Diseases, NIH",
    country: "US",
    claim: "The ~7,700 kcal per kg (3,500 kcal per lb) rule is a rough average that depends on how much of the loss is fat vs lean tissue; treat weekly deficits as estimates and correct from the scale.",
    url: "https://doi.org/10.1038/sj.ijo.0803720",
  },
  "hall-2011": {
    id: "hall-2011",
    short: "Hall 2011",
    citation:
      "Hall KD, Sacks G, Chandramohan D, et al. Quantification of the effect of energy imbalance on bodyweight. Lancet. 2011;378(9793):826-837.",
    institution: "NIDDK, National Institutes of Health",
    country: "US",
    claim: "Weight loss slows as the body adapts; a fixed deficit does not produce linear loss forever, so targets must be re-checked against real weigh-ins.",
    url: "https://doi.org/10.1016/S0140-6736(11)60812-X",
  },
  "weinheimer-2010": {
    id: "weinheimer-2010",
    short: "Weinheimer 2010",
    citation:
      "Weinheimer EM, Sands LP, Campbell WW. A systematic review of the separate and combined effects of energy restriction and exercise on fat-free mass in middle-aged and older adults. Nutr Rev. 2010;68(7):375-388.",
    institution: "Purdue University",
    country: "US",
    claim: "Dieting without resistance training loses roughly 20–35% of the weight as lean mass; adding resistance training protects it.",
    url: "https://doi.org/10.1111/j.1753-4887.2010.00298.x",
  },
  "hudson-2020": {
    id: "hudson-2020",
    short: "Hudson 2020",
    citation:
      "Hudson JL, Wang Y, Bergia RE, Campbell WW. Protein intake greater than the RDA differentially influences whole-body lean mass responses to purposeful catabolic and anabolic stressors: a systematic review and meta-analysis. Adv Nutr. 2020;11(3):548-558.",
    institution: "Purdue University",
    country: "US",
    claim: "Protein above the RDA preserves lean mass during energy restriction and augments it with resistance training.",
    url: "https://doi.org/10.1093/advances/nmz106",
  },
  "iom-2005-macros": {
    id: "iom-2005-macros",
    short: "IOM 2005 (DRI macronutrients)",
    citation:
      "Institute of Medicine. Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids. Washington, DC: National Academies Press; 2005.",
    institution: "Institute of Medicine (National Academies)",
    country: "US",
    claim: "Acceptable macronutrient ranges: fat 20–35%, carbohydrate 45–65%, protein 10–35% of calories; fiber 14 g per 1,000 kcal.",
    url: "https://doi.org/10.17226/10490",
  },
  "iom-2004-water": {
    id: "iom-2004-water",
    short: "IOM 2004 (water)",
    citation:
      "Institute of Medicine. Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate. Washington, DC: National Academies Press; 2004.",
    institution: "Institute of Medicine (National Academies)",
    country: "US",
    claim: "Adequate intake of total water: ~3.7 L/day for men and ~2.7 L/day for women (about 80% from beverages).",
    url: "https://doi.org/10.17226/10925",
  },
  "dga-2020": {
    id: "dga-2020",
    short: "Dietary Guidelines for Americans 2020–2025",
    citation:
      "U.S. Department of Agriculture and U.S. Department of Health and Human Services. Dietary Guidelines for Americans, 2020–2025. 9th ed. December 2020.",
    institution: "USDA / HHS",
    country: "US",
    claim: "Saturated fat under 10% of calories, added sugars under 10%, sodium under 2,300 mg/day; fiber ~14 g per 1,000 kcal.",
    url: "https://www.dietaryguidelines.gov/",
  },
  "antonio-2015": {
    id: "antonio-2015",
    short: "Antonio 2015",
    citation:
      "Antonio J, Ellerbroek A, Silver T, et al. A high protein diet (3.4 g/kg/d) combined with a heavy resistance training program improves body composition in healthy trained men and women. J Int Soc Sports Nutr. 2015;12:39.",
    institution: "Nova Southeastern University",
    country: "US",
    claim: "Very high protein (3.4 g/kg/day) with lifting improved body composition and did not add fat, supporting the safety of the upper protein bands used here in healthy adults.",
    url: "https://doi.org/10.1186/s12970-015-0100-0",
  },
  "barakat-2020": {
    id: "barakat-2020",
    short: "Barakat 2020 (recomp)",
    citation:
      "Barakat C, Pearson J, Escalante G, Campbell B, De Souza EO. Body recomposition: can trained individuals build muscle and lose fat at the same time? Strength Cond J. 2020;42(5):7-21.",
    institution: "University of Tampa / California State University, San Bernardino / University of South Florida",
    country: "US",
    claim: "Simultaneous muscle gain and fat loss is realistic at maintenance calories with high protein (~2.6–3.5 g/kg fat-free mass), progressive lifting, and sleep — most in novices, returners, and people with more fat to lose.",
    url: "https://doi.org/10.1519/SSC.0000000000000584",
  },
  "ace-bodyfat": {
    id: "ace-bodyfat",
    short: "ACE body-fat categories",
    citation:
      "American Council on Exercise. Percent body fat norms for men and women (essential fat, athletes, fitness, average, obese).",
    institution: "American Council on Exercise",
    country: "US",
    claim: "Essential fat ≈ 10–13% (women) and 2–5% (men); athletes 14–20% / 6–13%; fitness 21–24% / 14–17%; average 25–31% / 18–24%; obese ≥32% / ≥25%.",
    url: "https://www.acefitness.org/resources/everyone/tools-calculators/percent-body-fat-calculator/",
  },
  "garthe-2011": {
    id: "garthe-2011",
    short: "Garthe 2011",
    citation:
      "Garthe I, Raastad T, Refsnes PE, Koivisto A, Sundgot-Borgen J. Effect of two different weight-loss rates on body composition and strength and power-related performance in elite athletes. Int J Sport Nutr Exerc Metab. 2011;21(2):97-104.",
    institution: "Norwegian School of Sport Sciences",
    country: "Non-US (supporting)",
    claim: "Athletes losing ~0.7% bodyweight/week gained lean mass and strength; the ~1.4%/week group did not.",
    url: "https://doi.org/10.1123/ijsnem.21.2.97",
  },
  "longland-2016": {
    id: "longland-2016",
    short: "Longland 2016",
    citation:
      "Longland TM, Oikawa SY, Mitchell CJ, Devries MC, Phillips SM. Higher compared with lower dietary protein during an energy deficit combined with intense exercise promotes greater lean mass gain and fat mass loss. Am J Clin Nutr. 2016;103(3):738-746.",
    institution: "McMaster University",
    country: "Non-US (supporting)",
    claim: "In a 40% deficit with hard training, 2.4 g/kg protein gained lean mass and lost more fat than 1.2 g/kg.",
    url: "https://doi.org/10.3945/ajcn.115.119339",
  },
  "morton-2018": {
    id: "morton-2018",
    short: "Morton 2018",
    citation:
      "Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med. 2018;52(6):376-384.",
    institution: "McMaster University",
    country: "Non-US (supporting)",
    claim: "Muscle gain from extra protein plateaus around ~1.6 g/kg/day (upper 95% CI ~2.2 g/kg/day) in healthy adults who lift.",
    url: "https://doi.org/10.1136/bjsports-2017-097608",
  },
};

export function evidenceList(ids: readonly EvidenceId[]): Evidence[] {
  const seen = new Set<EvidenceId>();
  const out: Evidence[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(EVIDENCE[id]);
  }
  return out;
}

export const ALL_EVIDENCE: Evidence[] = Object.values(EVIDENCE);
