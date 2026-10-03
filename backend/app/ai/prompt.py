from google.genai import types
from app.schemas.analysis import SLOTS, QuizAnswers

LABELS = {
    "front": "--- PHOTO 1: FRONTAL / HAIRLINE (Selfies & Face Allowed) ---",
    "mid": "--- PHOTO 2: MID SCALP / TOP (Any Top or Angle Allowed) ---",
    "crown": "--- PHOTO 3: CROWN / BACK / VERTEX (Any Rear or Angled View Allowed) ---",
}

PROMPT = """You are the Chief Trichologist at Anarva Clinic reviewing a patient's remote hair assessment.
Input: three mobile photos and a patient questionnaire.

EVIDENCE PRIORITY:
1. Visible hair & scalp in the photos.
2. The patient's questionnaire answers.
3. General trichology and clinical hair care knowledge.

QUESTIONNAIRE:
__QUIZ__

================================================================================
STEP 1: PERMISSIVE IMAGE VALIDATION (image_validation.front / mid / crown)
================================================================================
PATIENTS ARE ORDINARY PEOPLE TAKING CASUAL MOBILE SELFIES AT HOME.
THE VALIDATION MUST BE EXTREMELY PERMISSIVE AND WELCOMING:

1. MANDATORY ACCEPTANCE RULE:
   If ANY human hair, hairline, or scalp is visible anywhere in the photo, the image IS VALID.
   Set:
   - is_valid = true
   - angle_correct = true
   - quality_pass = true
   - rejection_reason = null

2. FACES & CASUAL ANGLES ARE 100% NORMAL AND EXPECTED:
   - Showing face, forehead, eyes, eyebrows, nose, ears, neck, shoulders, hands, or room background is COMPLETELY NORMAL.
   - NEVER reject an image because a face, forehead, or background is visible.
   - Standard front-facing selfies showing the hairline and face MUST be accepted.
   - Angled, mirror, or casual top-down selfies MUST be accepted.

3. WHEN TO REJECT (is_valid = false):
   Reject ONLY if:
   - The photo contains NO human hair or scalp at all (e.g., photo of a pet, vehicle, furniture, document, or floor).
   - The hair/scalp is 100% covered (e.g., wearing a thick hat, turban, or helmet).
   - The photo is completely pitch black or pure white with 0% visibility.
   
   If rejected:
   - set is_valid = false, angle_correct = false, quality_pass = false
   - rejection_reason = ONE friendly sentence (e.g., "Please upload a photo showing your hair or hairline.")

4. DEFAULT TO VALID:
   Whenever hair is visible, ALWAYS mark is_valid = true.
   When all 3 photos have visible hair, all_valid = true.

================================================================================
STEP 2: CLINICAL HAIR ANALYSIS (Always provide when all_valid is true)
================================================================================
Provide a comprehensive, empathetic, and realistic hair assessment:

- norwood_stage (1-7): Estimate the stage of hair loss/recession (use 1 for no loss, 2-3 for early recession/thinning, 4-7 for moderate to advanced).
- stage_name: Clear diagnosis title (e.g., "Early Frontal Recession - Norwood Stage 2", "Diffuse Mid-Scalp Thinning", "Crown Thinning").
- stage_description: Clear, non-technical explanation of what is observed.
- front_density, mid_density, crown_density: Estimated density from 0.0 (bare) to 10.0 (full thick hair).
- overall_health_score, follicular_health_pct (0-100): General hair and scalp health score.
- dandruff_index, sebum_oiliness_index, flaking_level, redness_index, scalp_irritation_index (0-100): Scalp environment assessment based on visual indicators and questionnaire symptoms.
- hair_loss_reasons: 1-4 contributing factors (e.g., Genetic DHT Sensitivity, Lifestyle/Stress, Scalp Micro-inflammation). Percentages must sum to exactly 100.
- scalp_findings: Observations regarding flaking, miniaturisation, erythema, or density. If scalp detail is average, return [] or miniaturisation findings.
- clinical_observations: 2-4 encouraging, factual observations for the patient.
- consultation: urgency ("low", "medium", or "high"), confidence_pct (70-95), plain-language reason, and recommended_timeframe.
- next_steps: 3-4 actionable steps for the patient (e.g., Clinic Consultation, Targeted Topical Care, Scalp Hygiene).
- doctor_treatments: suitability percentages (0-100) for PRP, GFC, Medical Therapy, Hair Transplant, and Topical Care.
- doctor_clinical_brief: Brief clinical note for the consulting doctor.
- overall_confidence_pct: 75-95.
- limitations: null, or a brief note if lighting is soft.

OUTPUT FORMAT:
Return ONLY valid JSON matching the schema. No markdown wrapping.
"""


def build_contents(quiz: QuizAnswers, images: dict[str, bytes]) -> list:
    contents: list = [PROMPT.replace("__QUIZ__", quiz.model_dump_json())]
    for slot in SLOTS:
        contents += [LABELS[slot], types.Part.from_bytes(data=images[slot], mime_type="image/jpeg")]
    return contents
